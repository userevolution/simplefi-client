import getCurveLiquidityHistory from './getCurveLiquidityHistory';
import getUniswapLiquidityHistory from './getUniswapLiquidityHistory';
import getAaveLiquidityHistory from './getAaveLiquidityHistory';
import helpers from '../../../../helpers';

/**
 * 
 * @param {Array} trackedFields - all tracked fields
 * @param {Object} field - currently analysed earning field
 * @param {Object} receiptToken - current field's receipt token
 * @param {Array} userReceiptTokenTxs - all user transactions involving receipt token
 * @param {String} userAccount - user's ethereum account
 * @dev switch is based on the field's protocol name, assuming liquidity history
 *      extraction method is the same for all of a protocol's earning fields 
 *      whitelist is used to identify when receiptTokens are staked elsewhere
 * @return {Array} - a list of user transactions ready to be processed by calcROI helper: {
 *    pricePerToken: at the time of the transaction
 *    one of four tx types: txIn, txOut, staked or unstaked (one filled with value, others undefined)
 *    txDate: date object
 *    tx: object containing all tx details (content can vary based on source)
 *    userBalanceAfterTx: only for certain fields that continuously update user token balances (e.g. aTokens)
 *  }
 */
async function getUserLiquidityHistory(trackedFields, field, receiptToken, userReceiptTokenTxs, userAccount) {
  
  const whitelist = helpers.createWhitelist(trackedFields, field);
  let liquidityHistory;

  switch (field.protocol.name) {

    case "Curve":
      /* @dev: this function contains a array.map of multiple calls to coinGecko,
               hence the use of a promise.all in the parent func (getROIs)
      */
      liquidityHistory = await getCurveLiquidityHistory(field, receiptToken, userReceiptTokenTxs, userAccount, whitelist)
      break;
      
    case "Uniswap":
      liquidityHistory = await getUniswapLiquidityHistory(field, userReceiptTokenTxs, userAccount, whitelist)
      break;

    case "Aave":
      liquidityHistory = await getAaveLiquidityHistory(receiptToken, userReceiptTokenTxs, userAccount, whitelist)
      break;

    default:
      break;
  }
  return liquidityHistory;
}

export default getUserLiquidityHistory;