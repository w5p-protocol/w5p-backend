import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { Web5 } from "@web5/api";

const { web5, did } = await Web5.connect(); 

const app = express();
const port = process.env.PORT || 5550;

app.get('/explore', async (req:Request, res:Response) => {
    try {
        const resp = await web5.dwn.records.query({
            from: did,
            message: {
                filter: {
                    schema: 'w5p.backend/protocol/schema',
                    dataFormat: 'application/json'
                }
            }
        })
        if (resp.records) {
            const records = resp.records.map(async (e) => {
                const data = await e.data.json();
                return data
            })
            return res.json(records)
        }else {
            return res.json([])
        }
    } catch (error) {
        return res.status(400).json({message: "error occured while fetching from dwn"})
    }
});

app.post('/publish', async (req:Request, res:Response) => {
    try {
        const resp = await web5.dwn.records.create({
            data: {
                title: req.body.title,
                recordId: req.body.id,
            },
            message: {
                schema: 'w5p.backend/protocol/schema',
                dataFormat: 'application/json'
            }
        })
    
        return res.json(resp)
    } catch (error) {
        return res.status(400).json({message: "error occured while saving to dwn"})
    }
});

app.listen(port, () => {
    console.log(`App running on port :${port}`)
})