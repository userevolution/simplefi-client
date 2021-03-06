/**
 * 
 * @param {Object} field currently analysed farming field
 * @param {Array} userTokenTransactions all user ERC20 transactions
 * @param {Array} userNormalTransactions all user "normal" transactions
 * @return {Array} - user farming transactions sorted by type: staking, unstaking or claim
 *                   type is deduced from the [staking | unstaking | reward]Amount property
 * @dev - note that the receiptToken property is added to all transactions, even reward claims
 *        this is because for reward claims it will be used to get an accurate read of the historical 
 *        balance in the Farming details page transaction table
 */       

function sortFarmingTxs(field, userTokenTransactions, userNormalTransactions) {
  const rewardDepositContract = field.contractAddresses.find(contractAddress => contractAddress.addressTypes.includes('deposit'));
  const rewardWithdrawalContract = field.contractAddresses.find(contractAddress => contractAddress.addressTypes.includes('withdraw'));
  
  const cropTokenAddresses = {};
  field.cropTokens.forEach(cropToken => {
    cropTokenAddresses[cropToken.address.toLowerCase()] = cropToken;
  });

  const sortedTxs = userTokenTransactions.reduce((acc, tx) => {

    //@dev: assumes only one seed token per staking/farming field
    const receiptToken = field.seedTokens[0];

    //identify rewards claimed
    if (cropTokenAddresses[tx.contractAddress]) {
      
      //Check if reward address is in input method rather than from address
      let addressInMethod = false;
      if (tx.from === '0x0000000000000000000000000000000000000000') {
        const referenceTx = userNormalTransactions.find(normalTx => normalTx.hash === tx.hash);
        if (referenceTx) {
          const methodInput = '0x' + referenceTx.input.slice(-40);
          if (methodInput === rewardWithdrawalContract.address.toLowerCase()) addressInMethod = true;
        }
      }

      //CHECK: should this rather be named unclaimedReward contract?
      if (tx.from === rewardWithdrawalContract.address.toLowerCase() || addressInMethod) {
        const cropToken = cropTokenAddresses[tx.contractAddress];
        //@dev: assumes all crop tokens are base tokens in DB
        const {priceApi, decimals} = cropToken
        const rewardAmount = tx.value / Number(`1e${decimals}`);
        return [...acc, {tx, cropToken, priceApi, rewardAmount, receiptToken}]
      } else {
        return acc;
      }

    } else if (tx.contractAddress === receiptToken.address.toLowerCase()) {
        //identify staking tx
        //@dev: assumes the correct deposit method was used
        if (tx.to === rewardDepositContract.address.toLowerCase()) {
          const stakingAmount = tx.value / Number(`1e${receiptToken.decimals}`);
          return [...acc, {tx, receiptToken, stakingAmount}];
          //identify unstaking tx
        } else if (tx.from === rewardWithdrawalContract.address.toLowerCase()) {
          const unstakingAmount = tx.value / Number(`1e${receiptToken.decimals}`);
          return [...acc, {tx, receiptToken, unstakingAmount}];
        } else {
          return acc;
        }

    } else {
      return acc;
    }
  }, []);

  return sortedTxs;
}

export default sortFarmingTxs;