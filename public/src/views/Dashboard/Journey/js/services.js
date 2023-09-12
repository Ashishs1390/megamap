app.service('Activity', function($http) {
  return {
    log: function(node, action, attribute, viewCount) {
      $http.post('/api/journey/activity', {
        uuid: node,
        date: new Date(),
        view_count: viewCount
      }).then(function(resp) {
        // console.log(resp)
      }).catch(function(err) {
        // console.log(err)
      })
    }
  }
})

app.service('Kpis', function($http) {
  return {
    journey: function(uuid) {
      return $http.get('/api/journey/kpis/'+uuid)
      .then(function(resp) {
        if(resp.status === 200) {
          return resp.data;
        } else {
          console.error('problem getting journey kpis');
          return [];
        }
      })
    }
  }
})

app.service('Scores', function($http) {
  return {
    journey_score: function(journey) {
      
      if(journey.journey_score) {
        return journey.journey_score.toFixed(2)
      } else {
        return journey.journey_score
      }
    },
    journey_importance: function(journey) {
        if(typeof(journey.interactions) == "string"){
            journey.interactions = JSON.parse(journey.interactions);  
          }
      for (var i of journey.interactions) {
        
        if(i.uuid === journey.important_score_interaction) {
          if(journey.journey_importance_score == undefined){
              return i.importance ? i.importance.toFixed(2) : 0;
          } else{
            return journey.journey_importance_score.toFixed(2);
          }
        }
      }
    },
    journey_effectiveness: function(journey) {
      if(typeof(journey.interactions) == "string"){
            journey.interactions = JSON.parse(journey.interactions);  
          }
      for (var i of journey.interactions) {
        if(i.uuid === journey.effective_score_interaction) {
           if(journey.journey_effectiveness_score == undefined){
              return i.effectiveness ? i.effectiveness.toFixed(2) : 0;
          }
          else{
          return journey.journey_effectiveness_score.toFixed(2)
          }
        }
      }
    },
    journey_automatic_score: function(journey) {
      var imp, eff, imp_avg, eff_avg;

      imp = { sum: 0, length: 0 }
      eff = { sum: 0, length: 0 }
      if(typeof(journey.interactions) == "string"){
            journey.interactions = JSON.parse(journey.interactions);  
          }
      for (var i of journey.interactions) {
        if(i.importance) {
          imp.sum += i.importance;
          imp.length++;
        }
        if(i.effectiveness) {
          eff.sum += i.effectiveness;
          eff.length++;
        }
      }
      if(imp.sum) {
        imp_avg = imp.sum / imp.length;
      }
      if(eff.sum) {
        eff_avg = eff.sum / eff.length;
      }
      if(imp_avg && eff_avg) {
        return ((imp_avg + eff_avg) / 2).toFixed(2);
      } else if(imp_avg && !eff_avg) {
        return imp_avg.toFixed(2);
      } else if(!imp_avg && eff_avg) {
        return eff_avg.toFixed(2);
      } else {
        return null;
      }
    }
  }
})

app.service('DynamicJourneyFields', function() {
  return [
    {
      correlation_a: { label: 'Correlation A' }
    },
    {
      correlation_b: { label: 'Correlation B' }
    },
    {
      correlation_c: { label: 'Correlation C' }
    },
    {
      correlation_d: { label: 'Correlation D' }
    },
    {
      correlation_e: { label: 'Correlation E' }
    },
    {
      correlation_f: { label: 'Correlation F' }
    }
  ]
})

app.service('DynamicNoteFields', function() {
  return [
    {
      correlation: { label: 'Correlation A' }
    },
    {
      correlation_b: { label: 'Correlation B' }
    },
    {
      correlation_c: { label: 'Correlation C' }
    },
    {
      correlation_d: { label: 'Correlation D' }
    },
    {
      correlation_e: { label: 'Correlation E' }
    },
    {
      primary: { label: 'Primary KPI' }
    },
    {
      secondary: { label: 'Secondary KPI' }
    }
  ]
})
