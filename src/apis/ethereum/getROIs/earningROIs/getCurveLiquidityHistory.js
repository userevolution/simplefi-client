import { getOneCurvePoolRawData } from '../../protocolQueries';
import { getHistoricalPrice } from '../../../coinGecko/getHistoricalPrice';
import helpers from '../../../../helpers';

/**
 * 
 * @param {Object} field - current Curve earning (liquidity pool) field
 * @param {Object} receiptToken - fields receipt token, used to track user holding changes
 * @param {Array} userReceiptTokenTxs - all transactions involving user's receipt token
 * @param {String} userAccount - user's Ethereum account
 * @param {Array} whitelist - array of staking addresses, to avoid staking/unstaking receipt tokens being counted as a realised profit/loss or new investment
 */
async function getCurveLiquidityHistory(field, receiptToken, userReceiptTokenTxs, userAccount, whitelist) {
  const timeFormatter = new Intl.DateTimeFormat('en-GB');
  const historicalCurveStats = await getOneCurvePoolRawData(field.name);

  const liquidityHistory = userReceiptTokenTxs.map(async tx => {
    const txDate = new Date(Number(tx.timeStamp) * 1000);
    //@dev: simplify date to just day/month/year (no time) to find corresponding day in curve snapshot data
    const compDate = timeFormatter.format(txDate);
    const historicalStat = historicalCurveStats.find(day => compDate === timeFormatter.format(new Date(Number(day.timestamp) * 1000)));

    let fieldHistReserveValue = 0;

    for (let seed of field.seedTokens) {
      const histSeedValue = await getHistoricalPrice(seed.priceApi, tx.timeStamp)

      // Manage edge case where the seed token is Eth, and therefore has no tokenContract to pull decimals from
      //TODO: pull decimals directly from seedToken rather than from its token contract - check createBalanceContracts and populateFromCache
      let seedDecimalDivisor = 1e18;
      if (seed.tokenContract) {
        seedDecimalDivisor = Number(`1e${seed.tokenContract.decimals}`);
      }
      const decimaledReserve = historicalStat.balances[seed.seedIndex]/seedDecimalDivisor;
      fieldHistReserveValue += histSeedValue * decimaledReserve;
    }
    //TODO: check impact of split admin fees and use of virtual price
    const pricePerToken = fieldHistReserveValue / (historicalStat.supply / Number(`1e${receiptToken.tokenContract.decimals}`));
    const {txIn, txOut, staked, unstaked} = helpers.sortLiquidityTxs(tx, userAccount, whitelist);

    return {tx, txDate, pricePerToken, txIn, txOut, staked, unstaked}
  })

  return liquidityHistory;
}

export default getCurveLiquidityHistory;