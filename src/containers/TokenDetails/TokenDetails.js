import React, {useState, useEffect} from 'react';
import './TokenDetails.css';
import DetailsPieChart from '../../components/DetailsPieChart/DetailsPieChart';
import helpers from '../../helpers';

export default function TokenDetails({name, userTokens, userTokenPrices, history}) {

  const [currentToken] = useState(userTokens.find(userToken=> userToken.name === name));
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    if (name) {
      const totalTokenBalance = helpers.extractTotalTokenBalance(currentToken);
      setTotalBalance(totalTokenBalance);
      setTotalValue(totalTokenBalance * userTokenPrices[name].usd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [currentToken]);

  if (!name) {
    history.push('/dashboard');
    return (<></>)
  }

  return(
    <div className="token-details">
      <div className="token-details-titles">
        <h2>{name}</h2>
        <p><span className='token-title-header'>Contract address</span>: <a href={`https://etherscan.io/token/${currentToken.address}`} target="_blank" rel="noreferrer">{currentToken.address}</a></p>
      </div>

      <div className="token-details-overviews">
        <div className="token-details-numbers">
          <div className="token-overview token-roi">
            <h2>Total balance</h2>
            <p>{Number(totalBalance.toFixed(2)).toLocaleString()}</p>
          </div>

          <div className="token-overview token-invested">
            <h2>Current value</h2>
            <p>${Number(totalValue.toFixed(2)).toLocaleString()}</p>
          </div>
        </div>

        <div className="token-source-container">
            <h2>Source of funds</h2>
          <div className="token-source-chart">
            <DetailsPieChart data={currentToken} type='token'/>
          </div>
        </div>
      </div>
    </div>
    )
}