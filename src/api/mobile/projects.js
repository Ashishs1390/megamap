import { Router } from 'express';

export default ({
	config,
	db,
	broadcast
}) => {

	let api = Router();

	api.get("/", (req, res) => {
    db.cypher({
      query: `MATCH (p:Project)-[:author]->(a:Person) RETURN p {
        .*,
        author: properties(a)
      } as project`
    }, (err, results) => {
      if(err) {
        res.sendStatus(400)
      } else {
        results = results.map(result => {
          delete result.project.author.password;
          return result.project;
        })
        res.status(200).send(results);
      }
    })
	});

  api.get('/:uuid', (req, res) => {
    db.cypher({
      params: {
        uuid: req.params.uuid
      },
      query: `
        MATCH (p:Project{uuid:{uuid}})-[:author]->(pa:Person)
        OPTIONAL MATCH (p)-[r:project_milestone]->(m:Milestone)
        OPTIONAL MATCH (m)-[:milestone_coordinator]->(ma:Person)
        WITH p, m, r, pa, collect(distinct properties(ma)) as ma
        RETURN p {
          .*,
          author: properties(pa),
          milestones: collect(distinct m {
            .*,
            order: r.order,
            owners: ma
          })
        } as project
      `
    }, (err, results) => {
      if(err) {
        res.sendStatus(400)
      } else {
        results = results[0].project;
        delete results.author.password;

        for(let milestone of results.milestones) {
          milestone.owners.map(owner => {
            delete owner.password;
            return owner;
          })
        }
        res.status(200).send(results);
      }
    })
  })

  api.get('/milestone/:uuid', (req, res) => {
    db.cypher({
      params: {
        uuid: req.params.uuid
      },
      query: `
        MATCH (m:Milestone{uuid:{uuid}})
        OPTIONAL MATCH (m)-[:milestone_coordinator]->(ma:Person)
        OPTIONAL MATCH (m)-[r:milestone_component]->(n:Note)-[:note_author]->(a:Person)
        RETURN m {
          .*,
          owners: collect(distinct properties(ma)),
          notes: collect(distinct n {
            .*,
            order: r.order,
            author: properties(a)
          })
        } as milestone
      `
    }, (err, results) => {
      if(err) {
        res.sendStatus(400)
      } else {
        results = results[0].milestone;
        results.owners.map(owner => {
          delete owner.password;
          return owner;
        })
        results.notes.map(note => {
          delete note.author.password;
          return note;
        })
        res.status(200).send(results);
      }
    })
  })

  api.get('/note/:uuid', (req, res) => {
    db.cypher({
      params: {
        uuid: req.params.uuid
      },
      query: `
        MATCH (n:Note{uuid:{uuid}})-[:note_author]->(na:Person)
        OPTIONAL MATCH (n)<-[c:comment]-(ca:Person)
        RETURN n {
          .*,
          author: properties(na),
          comments: collect(distinct c {
            .*,
            author: properties(ca)
          })
        } as note
      `
    }, (err, results) => {
      if(err) {
        res.sendStatus(400)
      } else {
        results = results[0].note;
        delete results.author.password;

        results.comments.map(comment => {
          delete comment.author.password;
          return comment;
        })
        res.status(200).send(results);
      }
    })
  })

	return api;
}
