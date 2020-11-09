import { ethers } from 'ethers';
import provider from './ethProvider';
import helpers from '../../helpers'

async function getFieldSeedHoldings (field, token, tokenContract) {
  const reserveMethod = helpers.findFieldMethod(field, 'underlying');

  let fieldBalance;

  switch (reserveMethod.type) {

    case "curveSwap":
      console.log(' ---> token.name from GFSH', token.name);
      //TODO: rename this seedIndex in DB
      const tokenIndex = token.seedPosition;
      console.log(' ---> tokenIndex', tokenIndex);

      if (!field.underlyingContract) {
        const { address, abi } = reserveMethod;
        field.underlyingContract = new ethers.Contract(address, abi, provider);
      }

      //TODO: add decimals to DB
      fieldBalance = await field.underlyingContract.balances(tokenIndex);
      fieldBalance = ethers.utils.formatUnits(fieldBalance, 18)
      break;

    default: 
    //TODO: refactor this as fields will no longer have default single addresses
    fieldBalance = await tokenContract.balanceOf(field.address);
    fieldBalance = Number(ethers.utils.formatUnits(fieldBalance, 18));
    break;

  }
  console.log('fieldBa;ance', fieldBalance);
  return fieldBalance;
}

export default getFieldSeedHoldings