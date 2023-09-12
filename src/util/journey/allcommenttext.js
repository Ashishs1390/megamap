'use strict';

const neo4j  = require( 'neo4j-driver' ).v1;
const sentiment = require( './sentiment.json' );

// always dryrun by default, prepend script with DRYRUN=false to save to db
let dryrun = process.env.DRYRUN == 'false' ? false : true;

const driver = neo4j.driver(
  'bolt://hobby-epflkgbadkkkgbkecmlkeacl.dbs.graphenedb.com:24786', neo4j.auth.basic(
    'ricky',
    'b.0MmGMi0pGGCj.E9Arytg07dsvWTsa'
  ));
const session = driver.session();

// ---------------------------------------------------

const journey = '40191920-c365-11e8-ba35-3fb138ce832b';

let query  = `
  MATCH (j:Journey{uuid:'${journey}'})<-[:note_journey]-(n:Note)<-[c:comment]-(p:Person)
  WITH collect(c.comment) as array
  RETURN trim(REDUCE(output = "", comment IN array | output + comment + " ")) AS comments;
`;

session.run( query ).then( result => {
  session.close();

  let commentText = result.records[0].get( 'comments' );

  formWordCloud( commentText );
  runSentimentAnalysis( commentText );

  driver.close();
})

function formWordCloud( commentText ) {
  
}

function runSentimentAnalysis( commentText ) {
  const comments = commentText.split( ' ' );

  const scores = {};

  for( let comment of comments ) {
    comment = comment.toUpperCase();

    if( sentiment[comment] ) {
      scores[comment] = sentiment[comment];
    }
  }

  console.log( scores );
}
