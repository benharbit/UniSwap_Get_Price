require('dotenv').config()
const Web3 = require('web3');
const { ChainId, Token, TokenAmount, Pair } = require('@uniswap/sdk');
const abis = require('./abis');
const { mainnet: addresses } = require('./addresses');
const JSBI = require('jsbi');


const zzz = JSBI.BigInt(29292);
console.log(zzz)
console.log(String(zzz))


 console.log("process=" + process.env.INFURA_URL)
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);


if(web3.eth.net.isListening()){
    console.log(`am connected`);
    web3.eth.getBlockNumber().then(console.log);
    //console.log(latest)
}
else{
    console.log(`not cargados`);
}
const kyber = new web3.eth.Contract(
  abis.kyber.kyberNetworkProxy,
  addresses.kyber.kyberNetworkProxy
);

const AMOUNT_ETH = 1;
const RECENT_ETH_PRICE = 2300;
const AMOUNT_ETH_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_DAI_WEI = web3.utils.toWei((AMOUNT_ETH * RECENT_ETH_PRICE).toString());

const init = async () => {
  const [dai, weth] = await Promise.all(
    [addresses.tokens.dai, addresses.tokens.weth].map(tokenAddress => (
      Token.fetchData(
        ChainId.MAINNET,
        tokenAddress,
      )
  )));
  const daiWeth = await Pair.fetchData(
    dai,
    weth
  );

  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);

      const kyberResults = await Promise.all([
          kyber
            .methods
            .getExpectedRate(
              addresses.tokens.dai, 
              '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
              AMOUNT_DAI_WEI
            ) 
            .call(),
          kyber
            .methods
            .getExpectedRate(
              '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 
              addresses.tokens.dai, 
              AMOUNT_ETH_WEI
            ) 
            .call()
      ]);
      const kyberRates = {
        buy: parseFloat(1 / (kyberResults[0].expectedRate / (10 ** 18))),
        sell: parseFloat(kyberResults[1].expectedRate / (10 ** 18))
      };
      console.log('Kyber ETH/DAI');
      console.log(kyberRates);

      const uniswapResults = await Promise.all([
        daiWeth.getOutputAmount(new TokenAmount(dai, AMOUNT_DAI_WEI)),
        daiWeth.getOutputAmount(new TokenAmount(weth, AMOUNT_ETH_WEI))
      ]);
      console.log("uniswap Results=",uniswapResults[0]);
      console.log("uniswap Results 2=",uniswapResults[1]);
      console.log("numeratorxx" + String(uniswapResults[1][0].numerator))
      console.log("avgxx" + String(uniswapResults[1][0].denominator))
      var numer =  Number(uniswapResults[1][0].numerator)
      var denom =  String(uniswapResults[1][0].denominator)
      console.log("num1="+numer/denom)

      var numer2 =  Number(uniswapResults[0][0].numerator)
      var denom2 =  String(uniswapResults[0][0].denominator)
      console.log("num2="+numer2/denom2)

    })
    .on('error', error => {
      console.log(error);
    });
}
init();

