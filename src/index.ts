import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { Web5 } from "@web5/api";
// node.js 18 and earlier,  needs globalThis.crypto polyfill
import { webcrypto } from "node:crypto";
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;
import cors from "cors"

const { web5, did } = await Web5.connect(); 

const app = express();
const port = process.env.PORT || 8080;

// set cors headers
app.use(cors({
    origin: "*"
}))

// remove all json null response value
app.set('json replacer', (k:any, v:any) => (v === null ? undefined : v))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/api/explore', async (req:Request, res:Response) => {
    try {
        const resp = await web5.dwn.records.query({
            from: did,
            message: {
                filter: {
                    schema: 'w5p.protocol/schemas/exploreSchema',
                    dataFormat: 'application/json'
                }
            }
        })
        if (resp.records) {
            const records = await Promise.all(resp.records.map(async (e) => {
                const data = await e.data.json();
                return {
                    id: e.id,
                    ...data
                }
            }))
            return res.json(records)
        }else {
            return res.json([])
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({message: "error occured while fetching from dwn"})
    }
});

app.post('/api/publish', async (req:Request, res:Response) => {
    if (!req.body.title || !req.body.recordId || !req.body.author) {
        return res.status(422).json({message: "at least one field was left undefined"})
    }
    try {
        const resp = await web5.dwn.records.create({
            data: {
                title: req.body.title,
                recordId: req.body.recordId,
                author: req.body.author
            },
            message: {
                schema: 'w5p.protocol/schemas/exploreSchema',
                dataFormat: 'application/json',
                recipient: req.body.author,
                published: true
            }
        })
        resp.record?.send(did);
        return res.json(resp)
    } catch (error) {
        console.log(error)
        return res.status(400).json({message: "error occured while saving to dwn"})
    }
});

app.get('/api/protocol/delete/:id', async (req:Request, res:Response) => {
    try {
        const resp = await web5.dwn.records.delete({
            from: did,
            message: {
                recordId: req.params.id
            }
        })
        return res.json(resp.status);
    } catch (error) {
        console.log(error)
        return res.status(400).json({message: "error occured while fetching from dwn"})
    }
});

app.get('/', (req:Request, res:Response) => {
    console.log("Log ...")
    return res.json('Working');
})

app.get('/api', (req:Request, res:Response) => {
    console.log("Log ...")
    return res.json('Working');
})

app.listen(port, () => {
    console.log(`App running on port :${port}`)
})