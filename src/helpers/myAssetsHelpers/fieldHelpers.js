function extractSummaryFieldValues (userFields) {
  const farmingFields = [];
  const earningFields = [];
  const totalInvested = {
    farmingInv: 0,
    earningInv: 0
  };
  const totalROI = {
    farmingROI: 0,
    earningROI: 0
  }
  const formatter = new Intl.NumberFormat("en-US", {
    style: 'percent',
    minimumFractionDigits: 2
  });

  userFields.forEach(field => {

    const { stakedPercent } = combineFieldBalances(field);
    //CHECK: quid using investmentValue and allTimeROI when a field has both farming and earning returns
    const { name, cropTokens, isEarning, investmentValue, earningROI, farmingROI } = field;
    
    if (cropTokens.length) {
      let farming = '';
      cropTokens && cropTokens.forEach(token => farming += `${token.name}, `);
      farming = farming.slice(0, -2);

      totalROI.farmingROI += farmingROI.allTimeROI * investmentValue;
      totalInvested.farmingInv += investmentValue;
      
      const APY = field.farmingAPY?.combinedAPY ? formatter.format(field.farmingAPY.combinedAPY) : formatter.format(field.farmingAPY);
      const ROI = formatter.format(farmingROI.allTimeROI);
      const invested = Number(investmentValue?.toFixed(2)).toLocaleString();

      farmingFields.push([name, invested, farming, ROI, APY])
    }
    
    if (isEarning) {
      //FIXME: ROI weight should be based on the historic investment value
      totalROI.earningROI += earningROI.allTimeROI * investmentValue;
      totalInvested.earningInv += investmentValue;
      
      const APY = formatter.format(field.earningAPY);
      const ROI = formatter.format(earningROI.allTimeROI);
      const invested = Number(investmentValue?.toFixed(2)).toLocaleString();
      
      earningFields.push([name, invested, stakedPercent, ROI, APY]);
    }
  })

  if (totalROI.farmingROI) {
    totalROI.farmingROI = totalROI.farmingROI / totalInvested.farmingInv;
  }

  if (totalROI.earningROI) {
    totalROI.earningROI = totalROI.earningROI / totalInvested.earningInv;
  }

  return {farmingFields, earningFields, totalInvested, totalROI}
}

function combineFieldBalances(field){
       
      let stakedBalance = 0;
      let combinedBalance = 0;
      let stakedPercent = 0;
      const formatter = new Intl.NumberFormat("en-US", {style: 'percent'});
      
      if (field.stakedBalance) {
        stakedBalance = field.stakedBalance.reduce((acc, curr) => acc + curr.balance, 0);
      }

      if (field.userBalance) {
        combinedBalance = field.userBalance + stakedBalance;
        stakedPercent = formatter.format(stakedBalance / combinedBalance);
      } else {
        combinedBalance = stakedBalance;
        stakedPercent = formatter.format(1);
      }
      
  return {
    combinedBalance: combinedBalance.toFixed(2),
    stakedPercent
  };
}

export {
  extractSummaryFieldValues
}