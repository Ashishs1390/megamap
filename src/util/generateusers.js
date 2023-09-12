'use strict';

// SCRIPT FOR BULK CREATING USERS
const bcrypt = require( 'bcryptjs' );
const uuidv1 = require( 'uuid/v1' );
const users  = require( './userstest.json' );
const neo4j  = require( 'neo4j-driver' ).v1;

// always dryrun by default, prepend script with DRYRUN=false to save to db
let dryrun = process.env.DRYRUN == 'false' ? false : true;

if( !dryrun ) {
  const driver = neo4j.driver(
    '', neo4j.auth.basic(
      '',
      ''
    ));
    const session = driver.session();
}

// ---------------------------------------------------

let query  = '';
let event_name = null;
let defaultPassword = 'P@ssword4';
let created_at = Date.now();


// construct cypher query
users.forEach(( user, index ) => {
  let password, username, firstname, lastname;

  // trim any leading or trailing whitespace on properties
  Object.keys(user).map( k => { user[k] = user[k].trim() })

  // determine plain text password
  password = ( user.password && user.password.length > 0 ) ? user.password : defaultPassword;
  // hash plain text
  password = bcrypt.hashSync( password, bcrypt.genSaltSync( 12 ) );

  // determine first and last names
  username  = user.email.split( '@' )[0];
  firstname = user.firstname ? user.firstname.toLowerCase() : username;
  lastname  = user.lastname ? user.lastname.toLowerCase() : '';

  query += `
    MERGE (p${index}:Person{email: '${user.email.toLowerCase()}'})
    ON MATCH
      SET p${index}.updated_at = ${created_at}
      ${event_name ? "SET p" + index + ".event = '" + event_name +"'" : ""}
    ON CREATE
      SET p${index}.password   = '${password}'
      SET p${index}.firstname  = '${firstname}'
      SET p${index}.lastname   = '${lastname}'
      SET p${index}.uuid       = '${uuidv1()}'
      SET p${index}.title      = '${user.email.toLowerCase()}'
      SET p${index}.created_at = ${created_at}
      ${event_name ? "SET p" + index + ".event = '" + event_name +"'" : ""}
  `

  console.log( user.email.toLowerCase() );
})

// print/run cypher query
if( dryrun ) {
  console.log( query );

  console.info( 'DRY RUN: Constructed Query Without Running on Database' );
}
else {
  console.log( query );

  session.run( query ).then( result => {
    session.close();

    console.info( 'PRODUCTION: Constructed Query and Ran on Database' );

    console.log( result.records );

    driver.close();
  })
}
