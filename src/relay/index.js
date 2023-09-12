import { Router } from 'express';

export default ({ config, db, io }) => {
    let api = Router();
    api.post('/', (req, res) => {
        let message = req.body.message;
        console.log(message);
    });
    return api;
}