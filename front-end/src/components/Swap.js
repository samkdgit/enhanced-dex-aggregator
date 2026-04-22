import React, { useEffect, useState } from 'react'
import { useSelector } from "react-redux"
import { Modal } from "react-bootstrap"
import { Button, CircularProgress } from "@mui/material";
import { ethers, utils } from 'ethers';
import qs from 'qs'

import "../assets/css/styles.css";
import { tokens, exchanges, exchangesMap } from "../utils/helpers";
import IRouter from "../artifacts/interfaces/IUniswapV2Router02.json";
import ISwapRouter from "../artifacts/interfaces/ISwapRouter.json";
import ERC20 from "../artifacts/interfaces/IERC20.json";
import Exchanges from './Exchanges';

function Swap() {
    const data = useSelector((state) => state.blockchain.value)
    const [amountIn, setAmountIn] = useState(0);
    const [amountOut, setAmountOut] = useState(0);
    const [tokenInBalance, setTokenInBalance] = useState(null);
    const [gasPrice, setGasPrice] = useState(null);
    const [bestExchange, setBestExchange] = useState(null);
    const [isSwapping, setIsSwapping] = useState(false);

    const [tradeSide, setTradeSide] = useState("");
    const [trade, setTrade] = useState({
        fromToken: "0",
        toToken: "1"
    });

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = (side) => {
        setTradeSide(side)
        setShow(true);
    }


    async function getPriceOut(_amountIn) {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            setAmountIn(Number(_amountIn))
            if (Number(_amountIn) !== 0) {
                const _tokenIn = fromTokenData ? fromTokenData.address : null
                const _tokenOut = toTokenData ? toTokenData.address : null
                if (!_tokenIn || !_tokenOut) {
                    setAmountOut("0")
                    return
                }
                let path = [_tokenIn, _tokenOut]

                let amount_in
                try {
                    amount_in = utils.parseUnits(_amountIn.toString(), fromTokenDecimals)
                } catch (err) {
                    setAmountOut("0")
                    return
                }
                const prices = await Promise.all(
                    exchanges[currentNet].map(async (e) => {
                        if (e.name !== "Uniswap V3") {
                            const router = new ethers.Contract(e.address, e.router.abi, provider)
                            try {
                                const amount = await router.getAmountsOut(amount_in, path)
                                return Number(utils.formatUnits(amount[1], toTokenDecimals))
                            } catch (err) {
                                return 0
                            }
                        } else {
                            const quoter = new ethers.Contract(e.address, e.quoter.abi, provider)
                            try {
                                const amount = await quoter.callStatic.quoteExactInputSingle(
                                    _tokenIn,
                                    _tokenOut,
                                    3000,
                                    amount_in,
                                    0
                                )
                                return Number(utils.formatUnits(amount, toTokenDecimals))
                            } catch (err) {
                                return 0
                            }
                        }
                    }))

                const maxPrice = Math.max.apply(null, prices)
                const maxPriceIndex = prices.indexOf(maxPrice)

                setAmountOut(maxPrice)
                getGasPrice(_tokenIn, _tokenOut, amount_in.toString())
                setBestExchange(exchangesMap[currentNet][maxPriceIndex])
            } else {
                setAmountOut("0")
            }
        }
    }

    async function getPriceIn(_amountOut) {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            setAmountOut(Number(_amountOut))
            if (Number(_amountOut) !== 0) {
                const _tokenIn = fromTokenData ? fromTokenData.address : null
                const _tokenOut = toTokenData ? toTokenData.address : null
                if (!_tokenIn || !_tokenOut) {
                    setAmountIn("0")
                    return
                }
                let path = [_tokenIn, _tokenOut]

                let amount_out
                try {
                    amount_out = utils.parseUnits(_amountOut.toString(), toTokenDecimals)
                } catch (err) {
                    setAmountIn("0")
                    return
                }
                const prices = await Promise.all(
                    exchanges[currentNet].map(async (e) => {
                        const router = new ethers.Contract(e.address, e.router.abi, provider)
                        try {
                            const amount = await router.getAmountsIn(amount_out, path)
                            return Number(utils.formatUnits(amount[0], fromTokenDecimals))
                        } catch (err) {
                            return 10 ** 60
                        }
                    }))

                const minPrice = Math.min.apply(null, prices)
                const minPriceIndex = prices.indexOf(minPrice)

                setAmountIn(minPrice)
                getGasPrice(_tokenOut, _tokenIn, amount_out.toString())
                setBestExchange(exchangesMap[currentNet][minPriceIndex])
            } else {
                setAmountIn("0")
            }
        }
    }

    async function swap() {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            try {
                setIsSwapping(true)
                const _tokenIn = fromTokenData ? fromTokenData.address : null
                const _tokenOut = toTokenData ? toTokenData.address : null
                if (!_tokenIn || !_tokenOut) {
                    setIsSwapping(false)
                    return
                }
                let path = [_tokenIn, _tokenOut]

                const _amountOutMin = Number(amountOut) * 0.95

                const amountOutMin = utils.parseUnits(_amountOutMin.toString(), toTokenDecimals)

                const signer = provider.getSigner()

                const erc20Contract = new ethers.Contract(_tokenIn, ERC20.abi, signer);

                const amount_in = utils.parseUnits(amountIn.toString(), fromTokenDecimals)

                logSwapToBackend("attempted")

                const approve_tx = await erc20Contract.approve(bestExchange["address"], amount_in)

                await approve_tx.wait()

                let timestamp = Math.floor(new Date().getTime() / 1000.0) + 15

                let router;
                if (bestExchange["name"] !== "Uniswap V3") {
                    router = new ethers.Contract(bestExchange["address"], IRouter.abi, signer)
                    try {
                        const swap_tx = await router.swapExactTokensForTokens(
                            amount_in,
                            amountOutMin,
                            path,
                            data.account,
                            timestamp
                        );
                        await swap_tx.wait()

                        logSwapToBackend("completed", swap_tx.hash)

                        setIsSwapping(false)
                        setAmountIn(null)
                        setAmountIn(null)
                    } catch (err) {
                        logSwapToBackend("failed", null, err.message)
                        setIsSwapping(false)
                        window.alert("An error has occured")
                    }
                } else {
                    router = new ethers.Contract(bestExchange["address"], ISwapRouter.abi, signer)
                    try {
                        const params = {
                            tokenIn: path[0],
                            tokenOut: path[1],
                            fee: 3000,
                            recipient: data.account,
                            deadline: timestamp,
                            amountIn: amount_in,
                            amountOutMinimum: amountOutMin,
                            sqrtPriceLimitX96: 0
                        }
                        const swap_tx = await router.exactInputSingle(params);
                        await swap_tx.wait()

                        logSwapToBackend("completed", swap_tx.hash)

                        setIsSwapping(false)
                        setAmountIn(null)
                        setAmountIn(null)
                    } catch (err) {
                        logSwapToBackend("failed", null, err.message)
                        setIsSwapping(false)
                        window.alert("An error has occured")
                    }
                }
            } catch (err) {
                logSwapToBackend("failed", null, err.message)
                setIsSwapping(false)
                window.alert("An error has occured")
            }
        }
    }

    async function getGasPrice(tokenIn, tokenOut, amount) {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            const params = {
                sellToken: tokenIn,
                buyToken: tokenOut,
                sellAmount: amount,
            }
            // Fetch the swap price.
            const response = await fetch(
                `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
            );
            const swapPriceJSON = await response.json();
            const _gasPrice = await provider.getGasPrice()
            setGasPrice(swapPriceJSON.estimatedGas)
        }
    }

    async function getErc20Balance() {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            const signer = provider.getSigner()

            const _tokenIn = fromTokenData ? fromTokenData.address : null
            if (!_tokenIn) {
                setTokenInBalance(null)
                return
            }

            const erc20Contract = new ethers.Contract(_tokenIn, ERC20.abi, signer);
            const balance = (await erc20Contract.balanceOf(data.account)).toString();

            setTokenInBalance(Number(utils.formatUnits(balance, fromTokenDecimals)))
        }
    }

    async function selectToken(tokenIndex) {
        handleClose()
        if (tradeSide == "from") {
            setTrade({ ...trade, fromToken: tokenIndex })
        } else {
            setTrade({ ...trade, toToken: tokenIndex })
        }
    }
    const currentNet = data.network !== "" ? data.network : "Ethereum Mainnet"
    // Change 1: use current network for token labels
    const currentTokens = tokens[currentNet] || []
    const fromTokenData = currentTokens[trade.fromToken]
    const toTokenData = currentTokens[trade.toToken]
    // Change 2: use token decimals instead of assuming 18
    const fromTokenDecimals = fromTokenData ? fromTokenData.decimals : 18
    const toTokenDecimals = toTokenData ? toTokenData.decimals : 18

    // Change 4: log swap updates to backend
    async function logSwapToBackend(status, txHash = null, errorMessage = null) {
        try {
            await fetch("http://localhost:5001/api/transaction-log", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    network: currentNet,
                    walletAddress: data.account,
                    fromToken: fromTokenData ? fromTokenData.name : null,
                    toToken: toTokenData ? toTokenData.name : null,
                    amountIn,
                    amountOutEstimated: amountOut,
                    exchange: bestExchange ? bestExchange.name : null,
                    txHash,
                    status,
                    timestamp: new Date().toISOString(),
                    errorMessage,
                }),
            })
        } catch (err) {
            console.log("Could not save swap log")
        }
    }

    useEffect(() => {
        if (window.ethereum != undefined && data.network !== "") {
            getErc20Balance()
        }
    }, [trade.fromToken, data.network])

    return (
        data.network !== "" ? (
            <div className="header" >
                <div className="header-container">
                    <div className="header-box">
                        <div id="window">
                            <h4>Swap</h4>
                            <div id="form">
                                <div className="swapbox">
                                    <div className="swapbox_select token_select"
                                        onClick={() => { handleShow("from") }}>
                                        {fromTokenData ? (
                                            <>
                                                <img className="token_img"
                                                    src={fromTokenData.image}
                                                />
                                                <span className='token_text'>
                                                    {fromTokenData.name}
                                                </span>
                                            </>
                                        ) : "Select A Token"}
                                    </div>
                                    <div className="swapbox_select">
                                        <input className="number form-control"
                                            type="number"
                                            value={amountIn !== 0 ? amountIn : ""}
                                            placeholder='Enter Amount'
                                            onChange={(e) => { getPriceOut(e.target.value) }} />
                                    </div>
                                </div>
                                <div className="swapbox">
                                    <div className="swapbox_select token_select"
                                        onClick={() => { handleShow("to") }}>
                                        {toTokenData ? (
                                            <>
                                                <img className="token_img"
                                                    src={toTokenData.image}
                                                />
                                                <span className='token_text'>
                                                    {toTokenData.name}
                                                </span>
                                            </>
                                        ) : "Select A Token"}
                                    </div>
                                    <div className="swapbox_select">
                                        <input className="number form-control"
                                            type="number"
                                            value={amountOut !== 0 ? amountOut : ""}
                                            placeholder={'Enter Amount'}
                                            onChange={(e) => { getPriceIn(e.target.value) }} />
                                    </div>
                                </div>
                                <div className="gas_estimate_label">
                                    Estimated Gas: <span>{gasPrice}</span>
                                </div>
                                <div className="gas_estimate_label">
                                    Your {fromTokenData ? fromTokenData.name : "Token"} Balance: <span>{tokenInBalance}</span>
                                </div>
                                <button className="btn btn-primary" style={{ width: "100%" }} onClick={swap}>
                                    {isSwapping ? <CircularProgress color="inherit" size={18} /> : "Swap"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Modal show={show} onHide={handleClose} style={{ overflow: 'scroll' }}>
                        <Modal.Header closeButton>
                            <Modal.Title>SELECT A TOKEN</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {currentTokens.map((token, index) => {
                                return (
                                    <div className="token_row" key={index} onClick={() => { selectToken(index) }} >
                                        <img className="token_img" src={token.image} />
                                        <span className="token_text">{token.name}</span>
                                    </div>
                                )
                            })}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="contained" onClick={handleClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                    <div className="header-box" style={{ textAlign: "center" }}>
                        <h3 >Exchanges</h3>
                        <Exchanges token0={trade.fromToken} token1={trade.toToken} />
                    </div>
                </div>
            </div>
        ) : null
    )
}

export default Swap;
