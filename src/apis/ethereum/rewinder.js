import helpers from '../../helpers';
import { getTotalFieldSupply, getFieldSeedReserves } from './';

/**
 * 
 * @param {Array} userFields - all fields the user is currently invested in at a depth of 0 (investment not restaked elsewhere)
 * @param {Array} trackedTokens - all tokens tracked by SimpleFi
 * @param {Array} trackedFields - all earning and farming fields tracked by SimpleFi
 * //TODO: detailed @dev explanation
 */
async function rewinder (userFields, trackedTokens, trackedFields) {
  const userTokenBalances = [];
  const userFeederFieldBalances = [];
  const totalFieldSupplyCache = []; // { fieldName, totalFieldSupply }
  const fieldSeedReserveCache = []; // { fieldName, seedReserves: [{tokenName, fieldReserve}] }

  for (const mainField of userFields) {
    const { contract, decimals } = mainField.fieldContracts.balanceContract;
    /*
    @dev: total supply indicates either 1) how many receipt tokens have been minted by the field
     or 2) how many input tokens the field holds (in cases where it issues no receipts)
     */
    //NOTE: This returns correctly for Aave but is unnecessary as the user's underlying balance is the same as it's field balance
    const totalMainFieldSupply = await getTotalFieldSupply(mainField.name, contract, decimals, totalFieldSupplyCache);
    const userShareOfMainField = mainField.userBalance / totalMainFieldSupply;
    //@dev: will extract the balance of underlying seed tokens owned by the user
    //NOTE: only one seed token for Aave - IS IT ALWAYS BASE? CAN ASSUME FOR NOW?
    for (const token of mainField.seedTokens) {
      await tokenBalanceExtractor(token, mainField, userShareOfMainField)
    }
  }

  const fieldBalances = helpers.combineFieldSuppliesAndReserves(totalFieldSupplyCache, fieldSeedReserveCache);

  return {
    userTokenBalances,
    userFeederFieldBalances,
    fieldBalances
   };


  /**
   * 
   * @param {Object} token - the currently analysed seed token of the target field
   * @param {Object} field - the field currently analysed (either a main field, or
   *                         after recursion, a feeder field)
   * @param {Float} share - the user's percentage holding of the Field's total supply
   * @param {Object} via - the currently analysed field's parent field
   * @dev  - this is a recursive function: if the currently analysed token isn't base, i.e.
   *         is the receipt (e.g. LP token) of another "feeder" field then the if (!isBase)
   *         condition identifies the feeder field, preps it (fetch total supply and calc
   *         user share) and runs its seed tokens through this function again until the tokens
   *         are all base
           - this function does not return anything, it's only role is to push data to
             the main Rewinder function's caches: 
               * userTokenBalances
               * userFeederFieldBalances
               * fieldSeedReserveCache (passed onto getFieldSeedReserves())
  */
 //TODO: add explainer on why totalFieldSupplyCache is passed to getFieldSeedReserve: to get Aave token supply which is = reserve of underlying and that operation is prob unnecessary 
  async function tokenBalanceExtractor (token, field, share, via) {
    const { tokenId, isBase, tokenContract } = token;
    
    //@dev: field seed reserves are the number of underlying tokens held by the field
    let fieldSeedReserve = await getFieldSeedReserves(field, token, tokenContract, fieldSeedReserveCache, totalFieldSupplyCache);
    
    // if isBase or !isBase
    //NOTE: for Aave, this is redundant - literally just reverts the operation in top end of rewinder
    const userTokenBalance = fieldSeedReserve * share;
    const balanceObj = {token, userTokenBalance, field};
    
    // get subfield path
    if (via) balanceObj.via = via;
    
    userTokenBalances.push(balanceObj);
    
    //CHECK here what happens when the Aave Curve pool recurses
    //CHECK this assumes  there is just one seed for 
    if (!isBase) {
      let feederField = trackedFields.find(field => field.receiptToken === tokenId);
      const parentField = field;

      //TODO: stop this from changing tracked Fields as well as user fields
      //TODO: avoid populating this multiple times (once in App.js)
      //TODO: document
      [feederField] = helpers.populateFieldTokensFromCache([feederField], trackedTokens);

      const { contract, decimals } = feederField.fieldContracts.balanceContract;
      const totalFeederSupply = await getTotalFieldSupply(feederField.name, contract, decimals, totalFieldSupplyCache);
      const userFieldBalance = fieldSeedReserve * share;
      const userFeederShare = userFieldBalance / totalFeederSupply;

      //rewoundFieldBalances will contain any field with a receipt token that was fed into a field the user has staked in
      userFeederFieldBalances.push({feederField, userFieldBalance, parentField});
      
      for (const token of feederField.seedTokens) {
        await tokenBalanceExtractor(token, feederField, userFeederShare, parentField)
      }
    }
  }
}

export default rewinder;

