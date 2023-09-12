'use strict';

// SCRIPT FOR BULK CREATING USERS
const users  = require( './csamanagersall.json' );
const neo4j  = require( 'neo4j-driver' ).v1;

const driver = neo4j.driver(
  'bolt://msftprod.westus.cloudapp.azure.com:7687', neo4j.auth.basic(
    'neo4j',
    '!Ruptive123!'
  ));
const session = driver.session();

// ---------------------------------------------------

let constantQuery = '';

let journeys = [
  '81055670-51b2-11e9-b7cb-9dc9f244295c',
  '86038a90-e220-11e8-b7a4-590466bdcb46',
  '3113ef90-e219-11e8-80fe-15181fd2dba6',
  '3b346840-e1e9-11e8-9f70-89847a9e5a9e'
]

journeys.forEach(( journey_uuid, jindex ) => {
  constantQuery += `
    MATCH (j${jindex}:Journey{uuid: '${journey_uuid}'})
  `
})

users.forEach(( user, uindex ) => {
  let query = constantQuery;

  query += `
    MATCH (p${uindex}:Person{email: '${user.email.trim().toLowerCase()}'})
  `

  journeys.forEach(( journey_uuid, jindex ) => {
    query += `
      MERGE (p${uindex})<-[:journey_attendee]-(j${jindex})
    `
  })


  session.run( query ).then( result => {
    console.log( user.email, result.records );

    if( user.email === users[ users.length - 1 ].email ) {
      session.close();
      driver.close();
    }
  })
})
