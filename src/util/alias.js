'use strict';

const users  = require( './aliasfiltered.json' );
const neo4j  = require( 'neo4j-driver' ).v1;


// always dryrun by default, prepend script with DRYRUN=false to save to db
// let dryrun = process.env.DRYRUN == 'false' ? false : true;

// if( !dryrun ) {
  const driver = neo4j.driver(
    'bolt://msftprod.westus.cloudapp.azure.com:7687', neo4j.auth.basic(
      'neo4j',
      '!Ruptive123!'
    ));
    const session = driver.session();
// }

// ---------------------------------------------------


let promises = [];

// construct cypher query
users.forEach(( user ) => {

  // trim any leading or trailing whitespace on properties
  Object.keys(user).map( k => { user[k] = user[k].trim() })

  if( user.email && user.email.length > 0 && user.alias && user.alias.length > 0 ) {
    let email = user.email.toLowerCase();
    let alias = user.alias.toLowerCase();

    let query = `MATCH (p:Person{email: '${alias}@microsoft.com'}) SET p.alias = '${email}'`

    let promise = session.run( query )

    promises.push( promise )

    console.log(user.email, user.alias)
  }
})

Promise.all( promises ).then(() => {
  console.log( 'all done' )

  session.close();

  driver.close();
})
