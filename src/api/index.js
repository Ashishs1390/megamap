import { Router } from 'express';
import nodes from './nodes';
import journeys from './journeys';
import templates from './templates';
import groups from './groups';
import stages from './stages';
import projects from './projects';
import mobileProjects from './mobile/projects';
import profiles from './profiles';
import reports from './reports';
import segments from './segments';
import personas from './personas';
import capabilitys from "./capabilitys";
import mots from "./mots";
import components from "./components";
import kpis from "./kpis";
import ideas from "./ideas";
import blockers from "./blockers";
import bullseye from './bullseye';
import stats from './stats';
import media from './media';
import users from './users';
import auth from './auth';
import tracking from './tracking';
import tests from './Tests/Tests';

import authLib from '../lib/auth';

const api = Router()

const apiPath = '/api';

export default ({ config }) => {
  const broadcast = require('../lib/broadcast');
  const db = require('../db');

  api.use(function(req, res, next) {
    if(req.originalUrl.includes('php')) {
      res.sendStatus(404);
    } else {
      authLib.authenticateRequests(req, res, next);
    }
  });

  api.post(`${apiPath}/publish`, ( req, res ) => {
    broadcast(req.body.channel, req.body.payload);
    res.sendStatus(200)
  })

  api.use(`${apiPath}/node`,       nodes({ config, db, broadcast }));
  api.use(`${apiPath}/journey`,    journeys({ config, db, broadcast }));
  api.use(`${apiPath}/template`,   templates({ config, db, broadcast }));
  api.use(`${apiPath}/group`,      groups({ config, db, broadcast }));
  api.use(`${apiPath}/stage`,      stages({ config, db, broadcast }));
  api.use(`${apiPath}/project`,    projects({ config, db, broadcast }));
  api.use(`${apiPath}/profile`,    profiles({ config, db, broadcast }));
  api.use(`${apiPath}/report`,     reports({ config, db, broadcast }));
  api.use(`${apiPath}/segment`,    segments({ config, db, broadcast }));
  api.use(`${apiPath}/persona`,    personas({ config, db, broadcast }));
  api.use(`${apiPath}/capability`, capabilitys({ config, db, broadcast }));
  api.use(`${apiPath}/mot`,        mots({ config, db, broadcast }));
  api.use(`${apiPath}/component`,  components({ config, db, broadcast }));
  api.use(`${apiPath}/tracking`,   tracking({ config, db, broadcast }));
  api.use(`${apiPath}/kpi`,        kpis({ config, db, broadcast }));
  api.use(`${apiPath}/ideas`,      ideas({ config, db, broadcast }));
  api.use(`${apiPath}/blockers`,   blockers({ config, db, broadcast }));
  api.use(`${apiPath}/bullseye`,   bullseye({ config, db, broadcast }));
  api.use(`${apiPath}/stats`,      stats({ config, db, broadcast }));
  api.use(`${apiPath}/media`,      media({ config, db, broadcast }));
  api.use(`${apiPath}/user`,       users({ config, db, broadcast }));
  api.use(`${apiPath}/auth`,       auth({ config, db, broadcast }));
  api.use(`${apiPath}/test`,       tests({ config, db }));

  // mobile
  api.use(`${apiPath}/mobile/projects`, mobileProjects({ config, db, broadcast }));

  // perhaps expose some API metadata at the root
  api.get(`${apiPath}/`, (req, res) => {
    res.sendStatus(200)
  });

  return api;

}
