import { Router } from 'express';
var _ = require('lodash');
import GraphJS from '../../lib/graph';
import JoinFactory from "./Join_Test_Factory";
import RemoveFactory from "./Remove_Test_Factory";
import DiffFactory from "./Difference_Test_Factory"


//var uuidv1 = require('uuid/v1')


//api.use('/node', nodes({config, db}));
export default ({ config, db }) => {

    let api = Router();

    api.get('/add', (req, res) => {
        let SG1 = JoinFactory.JoinSubGraph1();
        let SG2 = JoinFactory.JoinSubGraph2();
        let ExpectedResult = JoinFactory.JoinExpectedResult();
        GraphJS.CombineSubGraphs(SG1, SG2);

        var Differences = GraphJS.Differences(SG1, ExpectedResult);

        res.send(Differences);
    })

    api.get('/subtract', (req, res) => {
        let SG1 = RemoveFactory.RemoveSubGraph1();
        let SG2 = RemoveFactory.RemoveSubGraph2();
        let ExpectedResult = RemoveFactory.RemoveExpectedResult();
        GraphJS.SubtractSubGraphs(SG1, SG2);

        var Differences = GraphJS.Differences(SG1, ExpectedResult)
        res.send(Differences);
    })

    api.get('/getdiff', (req, res) => {
        let SG1 = DiffFactory.DiffSG1();

        let SG2 = DiffFactory.DiffSG2();
        let ExpectedResult = RemoveFactory.RemoveExpectedResult();
        let SG_new = GraphJS.Differences(SG1, SG2);

        res.send(SG_new);
    })

    return api;
}
