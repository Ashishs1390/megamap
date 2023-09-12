'use strict';

const neo4j = require('neo4j-driver');

if(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
	require('dotenv').config();
}

class Neo4j {
  constructor( graphUrl ) {
		if( graphUrl ) {
			// convert all http and https endpoints to bolt
			// graphUrl = graphUrl.replace(/^(http|https):\/\//, 'bolt://').replace(/:(7473|7474)/, ':7687').replace(/:(24780|24789)/, ':24786');

			console.log('Using Bolt Graph Endpoint: ', 'neo4j+s://a303597a.databases.neo4j.io' )

			// parse database endpoint
			// this.driver = neo4j.driver(
			// 	`${graphUrl.split('://')[0]}://${graphUrl.split('://')[1].split('@')[1]}`,
			// 	neo4j.auth.basic(
			// 		graphUrl.split('://')[1].split('@')[0].split(':')[0],
			// 		graphUrl.split('://')[1].split('@')[0].split(':')[1]
			// 	),
			// 	{ disableLosslessIntegers: true }
			// );

			this.driver = neo4j.driver(
				`bolt+s://a303597a.databases.neo4j.io`,
				neo4j.auth.basic(
					'neo4j',
					'mkObgd_ot3m6xJVDTg7iPUNohPiP3S7e6bLzWp4Zo_8'
				),
				{ disableLosslessIntegers: true }
			);
		}
		else {
			console.error( 'ERROR: no graph endpoint provided' )
		}
  }

  async cypher( payload, callback ) {
	//   console.log(payload, '-------payload--------')
	//   console.log(this.driver,'[[[[[[[[[]]]]]]]]]]')
		if( this.driver ) {
			const session = this.driver.session();

			let query, params;

			if (payload.queries && Array.isArray(payload.queries)) {
				console.log('---if--')
				let querySessions = payload.queries.map( query => {
					params = null;

					if( typeof( query ) !== 'string' ) {
						params = query.params || {};
						query  = query.query;
					}
					else {
						params = payload.params || {};
					}
					return session.run( query, params )
				})

				Promise.all(querySessions)
				.then( results => {
					// results = results.reduce(( a, v ) => a.concat( v ), [] )
					callback( null, results)

					session.close();
				})
				.catch( error => {
					callback( error, null )
				})
			}
			else {
				console.log('---else--')

				if( typeof( payload ) === 'string' ) {
					query = payload;
				}
				else {
					query  = payload.query;
					params = payload.params || {};
				}
				session.run(query, params )
					.then(results => {
						console.log(results);
					callback( null, results );

					session.close();
				})
					.catch(error => {
						console.log(error,'-------error------')
					callback( error, null );
				})
			}
		}
		else {
			return callback( 'ERROR: neo4j driver not available', null )
		}
	
  }

	run( session, query, params ) {
		return new Promise(( resolve, reject ) => {
			session.run( query, params ).then( result => {
				let results = result.records.map( record => {
					let obj = {};

					for( let key of record.keys ) {
						obj[ key ] = record.get( key );
					}

					return obj;
				});

				resolve( results );
			})
			.catch( error => reject( error ));
		});
	}
}

module.exports = new Neo4j( process.env.GRAPH_URL );
