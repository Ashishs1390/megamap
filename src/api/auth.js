import {
	Router
} from 'express';
var _ = require('lodash');
import GraphJS from '../lib/graph';
import GraphAPI from '../lib/db_api';
import Validators from '../lib/validators';
var jwt = require('jsonwebtoken');
var appConfig = require('../config/app');
var auth = require('../lib/auth');
var vars = require('../config/vars');
var error = require('../config/errors');
var cipher = require('../lib/cypher');
var bcrypt = require('bcryptjs');
var express = require('express');
var uuidv1 = require('uuid/v1');
var tenantConfig = require('../lib/tenants');

//api.use('/node', nodes({config, db}));
export default ({
	config,
	db,
	broadcast
}) => {

	let api = Router();

	api.get('/validateToken', auth.authenticateRequests, (req, res) => {
		res.status(200).send('it worked')
	})

	// Get current user
	api.get('/current', function(req, res){
		let SubGraph = {}
		GraphAPI.AddRemoteNodeToSubgraph(req.user.uuid, SubGraph, db)
		.then((node) => {
			delete SubGraph.nodes[req.user.uuid].properties.password;
			res.status(200).send(SubGraph);
		})
		.catch((err) => {
			res.status(500).send(err)
		});
	});

	api.post('/resetPassword', (req, res) => {
		console.log(req.body)
		let salt  = bcrypt.genSaltSync(vars.bcrypt.salt);
		let hash  = bcrypt.hashSync(req.body.password, salt);

		let query = `MATCH (n:Person{email:'${req.body.email}'}) SET n.password = '${hash}'`

		db.cypher({ query },
		function(err, results){
			if(err) {
				console.log(err)
				res.status(400).send('Not able to reset password')
			} else {
				console.log(results)
				res.status(200).send('Password reset')
			}
		})
	})

	api.post('/activate', (req, res) => {
		if(!req.body.token){
			res.status(403).send('missing token')
		} else {
			jwt.verify(req.body.token, appConfig.secret, function(err, obj) {
	      if (err) {
					res.status(403).send(err);
				} else {
					res.status(200).send(obj)
				};
	    });
		}
	})

	api.post('/batch', (req, res) => {
		let usersArr = req.body.new_users;

		for(let user of usersArr) {
			let salt  = bcrypt.genSaltSync(vars.bcrypt.salt);
			let hash  = bcrypt.hashSync('password', salt);
			let userArr = user.split(' ');
			let uuid  = uuidv1();
			let email = userArr[2].toLowerCase();
			let firstname = userArr[0];
			let lastname  = userArr[1];
			let name = `${firstname} ${lastname}`;

			let query = `CREATE (n:Person) SET n.uuid = '${uuid}' SET n.firstname = '${firstname}' SET n.lastname = '${lastname}' SET n.name = '${name}' SET n.title='${email}' SET n.email='${email}' SET n.password='${hash}' return n`;

			db.cypher({ query }, (err, result) => {
				console.log(err, (result ? JSON.stringify(result) : false))
			})
		}
		console.log('done')
		res.sendStatus(200);
	})

	api.post('/authenticate', (req, res) => {
		console.log("---------authenticate---------")
		let email, query, salt, hash, uuid, firstname, lastname, name, user, last_login, last_login_ip, last_login_coordinates;
		let SubGraph = {};

		// let subdomain = req.subdomains[0];

		if(!req.body) {
			return res.status(500).send({ message: "missing auth information" });
		}

		last_login = req.body.properties.last_login;
		last_login_ip = req.body.properties.last_login_ip;
		last_login_coordinates = req.body.properties.last_login_coordinates;
		console.log('----1111111----')

		if (['aad', 'selfservice'].includes(req.body.authType)) {
			console.log('----1.3-----')
			if( req.body.idToken.aud !== '592e0b94-dd3d-48e5-9a9e-61691718b65d' ) {
				// ensure correct application id
				return res.status(500).send({ message: "invalid auth information" })
			}
			// else if( !tenantConfig[subdomain].tids.includes( req.body.idToken.tid )) {
			// 	// check for valid tenant id for subdomain
			// 	return res.status(500).send({ message: "you do not have access to this resource" })
			// }
			else {
				console.log('----1.4-----')

				query = `
					OPTIONAL MATCH (m:Person)
					WHERE m.oid = {oid}
					 	OR m.email = {email}
						OR m.alias = {email}

					WITH CASE m WHEN null THEN $email ELSE m.email END as email

					MERGE (p:Person{email: email})
					ON MATCH
						 SET p.oid = {oid}
					ON CREATE
						 SET p.oid = {oid}
						 SET p.name = {name}
						 SET p.uuid = {uuid}
						 SET p.email = {email}
						 SET p.title = {title}
						 SET p.created_at = {created_at}
						 SET p.firstname = {firstname}
						 SET p.lastname = {lastname}

					RETURN p
				`;
				let params = {
					oid: req.body.idToken.oid,
					name: req.body.idToken.name || '',
					uuid: uuidv1(),
					created_at: Date.now()
				}
				console.log('----222222----')
				if( validateEmail(req.body.idToken.preferred_username )) {
					params.email = req.body.idToken.preferred_username.toLowerCase();
					params.title = req.body.idToken.preferred_username.toLowerCase();
				}
				else {
					params.email = req.body.idToken.name.toLowerCase();
					params.title = req.body.idToken.name.toLowerCase();
				}
				params.firstname = req.body.idToken.name.split(' ')[0] || ''
				params.lastname = req.body.idToken.name.split(' ')[1] || ''
				console.log("------------hitting cypher---------------")
				db.cypher({ query: query, params: params }, (err, result) => {
					console.log(result, "---result---")
					console.log(err, "---err---")

					if ( err ) {
						console.log( err );
						return res.status(500).send({ message: 'unable to find user in database' });
					}
					else {
						user = result[0].p.properties;
						console.log(user)
						// Save login location info
						query = `
							MATCH (n:Person{oid: '${user.oid}'})
							SET n.last_login='${last_login}'
						`;
						if(last_login_ip && last_login_coordinates) {
							query += `
							SET n.last_login_ip='${last_login_ip}'
							SET n.last_login_coordinates='${last_login_coordinates}'
							`
						}
						db.cypher({ query }, () => {})

						auth.login(user, null, true).then(function(token) {
							return res.status(200).send({
								token: token,
								user: {
									properties: user
								}
							});
						}).catch(function(err){
							return res.status(403).send(err);
						});
					}
				})
			}
		}
		else {
			let included = 0;
			for (let p of Object.keys(req.body)) {
				if(Object.keys(req.body).includes(p)) included++
			}
			if(Object.keys(req.body).length !== included) {
				res.status(500).send({ message: "missing auth information" });
			};

			email = req.body.properties.email.toLowerCase();

			if(!validateEmail(email)) {
				res.status(500).send({ message: "invalid email address" });
			}

			query = `MATCH (n:Person{email:'${email}'}) RETURN n limit 1`;

			db.cypher({ query }, (err, result) => {
				console.log(result, '-------------');
				console.log(err,'------errrr-------')
				if (err) {
					res.status(500).send({ message: 'user lookup: unable to query database' });
				} else {
					if (req.body.authType === 'register') {
			      // check if user exists
						if(result.length > 0){
			        res.status(401).send(error.auth.reg.taken);
			        // validate password to meet criteria
			      // } else if(!auth.validate('password', req.body.password)){
			      //   res.status(401).send(error.auth.invalid.password);
			        // verify password confirmation
			      } else if(req.body.password !== req.body.password_confirmation) {
			        res.status(401).send(error.auth.reg.mismatch);
			      } else {
							// create user
							salt  = bcrypt.genSaltSync(vars.bcrypt.salt);
							hash  = bcrypt.hashSync(req.body.password, salt);
							uuid  = uuidv1();
							firstname = req.body.properties.firstname;
							lastname  = req.body.properties.lastname;
							name  = `${req.body.properties.firstname} ${req.body.properties.lastname}`

							query = `
								CREATE (n:Person) SET n.uuid = '${uuid}'
								SET n.firstname = '${firstname}'
								SET n.lastname = '${lastname}'
								SET n.name = '${name}'
								SET n.title='${email}'
								SET n.email='${email}'
								SET n.password='${hash}'
								SET n.created_at='${Date.now()}'
								SET n.last_login='${last_login}'
								SET n.last_login_ip='${last_login_ip}'
								SET n.last_login_coordinates='${last_login_coordinates}'
								return n`;
							console.log(query,'----------')
							db.cypher({ query }, () => {
								if (err) { res.status(500).send({ message: err }); }

								GraphAPI.AddRemoteNodeToSubgraph(uuid, SubGraph, db)
								.then(node => {
									auth.login(node.properties, req.body.password).then(function(token){
										SubGraph.token = token;
										res.status(200).send(SubGraph);
									}).catch(function(err){
										res.status(403).send(err);
									});
								})
								.catch(err => {
									res.status(500).send(err)
								});
							})
						}
					}
					else if (req.body.authType === 'login') {

		        // check if user exists
						if(result.length < 1){
			        res.status(401).send(error.auth.log.notfound);
						} else {
							console.log(result.records[0]._fields[0].properties);
							// user = result[0].n.properties;
							user = result.records[0]._fields[0].properties;

							// Save login location info
							query = `
								MATCH (n:Person{email:'${email}'})
								SET n.last_login='${last_login}'
							`;
							if(last_login_ip && last_login_coordinates) {
								query += `
								SET n.last_login_ip='${last_login_ip}'
								SET n.last_login_coordinates='${last_login_coordinates}'
								`
							}

							db.cypher({ query }, () => {})
							auth.login(user, req.body.password).then(function(token){
								delete user.password
								res.status(200).send({
									token: token,
									user: {
										properties: user
									}
								});
							}).catch(function(err){
								res.status(403).send(err);
							});
						}
					}
					else {
						res.status(500).send(error.auth.unable)
					}
				}
			})
		}
	})

	api.put('/update', function(req, res){
		delete req.body.properties.admin;
		delete req.body.properties.tenant;
		delete req.body.properties.external;
		delete req.body.properties.power_user;

		let user, query;
		if (!req.body || !req.body.authType) { res.status(500).send({ message: "missing account information" }); }

		query = `MATCH (n:Person{uuid:'${req.user.uuid}'}) RETURN n`;
		db.cypher({ query }, (err, result) => {
			if (err) {
				console.log(err);
				res.status(500).send({ message: 'unable to query database' });
			}
			if(result.length > 0) {
				user  = result[0].n.properties;
				auth.update(req.user, user.password, req.body)
	      .then(function(changes, token){
					if(req.body.authType === 'password') changes.properties.password = changes.password;
					changes.properties.name = `${changes.properties.firstname} ${changes.properties.lastname}`;
					changes.properties.title = changes.properties.email;

					query = `MATCH (n:Person{uuid:'${req.user.uuid}'})`;
					Object.keys(changes.properties).forEach(function(key) {
					  query += ` SET n.${key} = '${changes.properties[key]}'`
					});
					query += ` SET n.updated_at = '${Date.now()}' RETURN n`;
					db.cypher({ query }, (err, result) => {
						if (err) res.status(500).send({ message: 'unable to query database' });
						let SubGraph = {}
						GraphAPI.AddRemoteNodeToSubgraph(req.user.uuid, SubGraph, db)
						.then((node) => {
							delete SubGraph.nodes[req.user.uuid].properties.password;
							SubGraph.token = token;
							console.log(token)
							res.status(200).send(SubGraph);
						})
						.catch((err) => {
							res.status(500).send(err)
						});
					})
	      }).catch(function(err){
	        res.status(404).send(err)
	      })
			}
		})
	});

	api.get('/:uuid', (req, res) => {
		let SubGraph = {};
		GraphAPI.AddRemoteNodeToSubgraph(req.params.uuid, SubGraph, db)
		.then(() => { res.send(SubGraph); return; })
		.catch((err) => { res.status(500).send(err); });
	})

	return api;
}


function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}
