import React, { useState } from 'react';
import './FieldDetails.css';
import { useEffect } from 'react';
import apollo from '../../apollo/index';
import { gql } from '@apollo/client';

export default function FieldDetails ({name, userTokens, userFields, userAccount}) {
  const [fullHistory, setFullHistory] = useState([]);
  const [roi, setRoi] = useState (0);

  //TODO: need current FIeld investment value
  //TODO: derive ROI from that and tx history
  
  //Uni func
  const currentField = userFields.find(field => field.name === name);
  const uniToken = userTokens.find(token => token.tokenId === currentField.receiptToken);
  let investmentValue = currentField.unstakedUserInvestmentValue;
  if (currentField.stakedBalance) investmentValue += currentField.stakedBalance.reduce((acc, curr) => acc + curr.userInvestmentValue, 0);



  function formatUniData(txHistory) {
    const fieldHistory = txHistory.data.liquidityPositionSnapshots.filter(snapshot => snapshot.pair.id === currentField.contractAddresses[0].address.toLowerCase());
    let cumBal = 0;
    const formattedHistory = fieldHistory.map(snapshot => {
      const txDate = new Date(snapshot.timestamp * 1000);
      const pricePerToken = Number(snapshot.reserveUSD) / Number(snapshot.liquidityTokenTotalSupply);
      let txIn, txOut;
      let staked, unstaked;
      const newBal = Number(snapshot.liquidityTokenBalance);
      if (cumBal < newBal) {
        txIn = newBal - cumBal;
        cumBal += txIn;
      } else {
        txOut = cumBal - newBal;
        cumBal -= txOut;
      }
      return {...snapshot, txDate, pricePerToken, txIn, txOut}
    })
    return formattedHistory;
  }

  useEffect(() => {
  apollo.uniswapClient.query(
    {
      query: gql`
        query getUserBalanceHistory ($user: String!) {
          liquidityPositionSnapshots (
            where: {user: $user}
            orderBy: timestamp
            orderDirection: asc
          ) {
            timestamp
            pair {
              id
            }
            liquidityTokenBalance
            liquidityTokenTotalSupply
            reserveUSD
          }
        }
      `,
      variables: { user: userAccount[0] }
    }
  )
    .then(res => {
      //not really formatted but categorised by in/out flow
      const formattedData = formatUniData(res);
      setRoi(calcROI(investmentValue, formattedData));
      setFullHistory(formattedData);
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //ROI definition: ((currVal of investment + amount realised) / amount invested) -1
  function calcROI (investmentValue, txHistory) {
    let amountInvested = 0;
    let amountRealised = 0;

    txHistory.forEach(tx => {
      const { txIn, txOut, pricePerToken } = tx;
      txIn ? amountInvested += txIn * pricePerToken : amountRealised += txOut * pricePerToken
    })

    return ((investmentValue + amountRealised) / amountInvested) - 1;    
  }


  return (
    <div className="field-details">
      <div className="field-details-titles">
        {/* TODO: quid fields both earning and farming? */}
        <h2 className="field-title">{name} {currentField.isEarning ? '(earning)' : '(farming)'}</h2>
        <p>Description: lorem ipsum dolor sit amet consectetuer</p>
        <p>Current nominal APY: {currentField.earningAPY ? (currentField.earningAPY*100).toFixed(2) : (currentField.farmingAPY*100).toFixed(2)}%</p>
      </div>
      <div className="field-details-numbers">
        <div className="field-roi">
          <h2>all time ROI</h2>
          <p>{(roi*100).toFixed(2)}%</p>
          {/* TODO: breakdown ROI due to fee and underlying value */}
          <div className="field-roi-graph">Graph</div>
        </div>

        <div className="field-invested">
          <h2>Total invested</h2>
          <p>${Number(investmentValue.toFixed()).toLocaleString()}</p>
          <div className="field-invested-graph">Pie chart and path</div>
        </div>
      </div>

      <div className="field-transactions">
        {fullHistory.map(tx => {
          return (
            <div className="tx-date">
              <p> on {tx.txDate.toLocaleDateString()} you {tx.txIn ? `bought ${tx.txIn.toFixed()}` : `sold ${tx.txOut.toFixed()}`} at ${tx.pricePerToken.toFixed()} </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}