import React, { useEffect, useState } from 'react'
import { ethers, utils } from 'ethers';
import { Table } from "@mui/material"
import { useSelector } from "react-redux";
import { tokens, exchanges } from "../utils/helpers";

function Exchanges(props) {

    const data = useSelector((state) => state.blockchain.value)
    const [amounts, setAmounts] = useState([])

    const currentNet = data.network !== "" ? data.network : "Ethereum Mainnet"
    // Change 2: use token decimals instead of assuming 18
    const currentTokens = tokens[currentNet] || []
    const fromTokenData = currentTokens[props.token0]
    const toTokenData = currentTokens[props.token1]
    const fromTokenDecimals = fromTokenData ? fromTokenData.decimals : 18
    const toTokenDecimals = toTokenData ? toTokenData.decimals : 18

    async function getPrices() {
        if (window.ethereum !== undefined) {
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

            const _tokenIn = fromTokenData ? fromTokenData.address : null
            const _tokenOut = toTokenData ? toTokenData.address : null
            if (!_tokenIn || !_tokenOut) {
                setAmounts([])
                return
            }
            let path = [_tokenIn, _tokenOut]

            let amountIn = utils.parseUnits("1", fromTokenDecimals)

            const items = await Promise.all(
                exchanges[currentNet].map(async (e) => {
                    if (e.name !== "Uniswap V3") {
                        const router = new ethers.Contract(e.address, e.router.abi, provider)
                        try {
                            const amount = await router.getAmountsOut(amountIn, path)

                            let item = {
                                exchange: e.name,
                                price: Number(utils.formatUnits(amount[1], toTokenDecimals))
                            }
                            return item
                        } catch (err) {
                            let item = {
                                exchange: e.name,
                                price: 0
                            }
                            return item
                        }
                    } else {
                        const quoter = new ethers.Contract(e.address, e.quoter.abi, provider)
                        try {
                            const amount = await quoter.callStatic.quoteExactInputSingle(
                                _tokenIn,
                                _tokenOut,
                                3000,
                                amountIn,
                                0
                            )

                            let item = {
                                exchange: e.name,
                                price: Number(utils.formatUnits(amount, toTokenDecimals))
                            }
                            return item
                        } catch (err) {
                            let item = {
                                exchange: e.name,
                                price: 0
                            }
                            return item
                        }
                    }
                }))
            setAmounts(items)
        }
    }

    /*
    setInterval(() => {
        getPrices()
    }, 30000);
    */

    useEffect(() => {
        if (window.ethereum != undefined && data.network !== "") {
            getPrices()
        }

    }, [props.token0, props.token1, data.network])

    return (
        <>
            <Table >
                <thead>
                    <tr>
                        <th>Exchange</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {amounts.map((a, index) => {
                        return (
                            <tr key={index}>
                                <td>
                                    {a.exchange}
                                </td>
                                <td>
                                    {a.price !== 0 ? parseFloat(a.price).toFixed(8) : "/"}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
        </>
    )
}

export default Exchanges;
