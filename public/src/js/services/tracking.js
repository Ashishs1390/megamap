
app.service('UITracking', function($http, $location, $rootScope, $stateParams) {
  return {
    start: function() {
      var whitelist = [
        "button", "a", "i", "span"
      ]

      $("body").click(function(event) {
        var tag = event.target.tagName.toLowerCase();

        if($(tag).closest("[track]").attr('track') == 'false') return;

        // track whitelisted element tags
        if( whitelist.includes(tag) ) {

          if( tag === 'span' ) {
            // check if the span is wrapped in an a, which would be more valuable (ex: user clicks nav text thats wrapped in a span, which is wrapped in an a)
            if( $( event.target ).closest( 'a' ).length > 0 ) {

              event.target = $( event.target ).closest('a')[0];

              // re-set target tag to nearest a
              tag = event.target.tagName.toLowerCase();
            }
          }
          var innerText;

          // special condition for stages (temporary)
          if( [... event.target.classList].includes( 'stage-tabs' )) {

            innerText = event.target.innerText.split( ' ' )[0];
          }
          else {
            innerText = event.target.innerText
          }

          // HTML element info
          var fulltag = ( tag + '__' + ( innerText.trim() || '_' ) + '__' + event.target.classList ).replace(/\W/g, "_").toLowerCase();

          // get nearest trackid if it exists
          var trackId = $( event.target ).closest("[track]").attr('track') || '';

          // get href or ui-sref on element or nearest element
          var toPath = $( event.target ).closest("[href]").attr('href') || $(event.target).closest("[ui-sref]").attr('ui-sref');

          // get nearest trackid if it exists
          var rels = $( event.target ).closest("[rels]").attr('rels') || '';

          // get target/primary node for activity, ex: journey workshop node uuid
          var nodeUuid = $stateParams.id || $stateParams.uuid || ( toPath ? toPath.split("?id=")[1] : undefined );

          // get timestamp in miliseconds
          var timestamp = Date.now();

          var params = {
            node_uuid: nodeUuid,
            user_uuid: $rootScope.Person.properties.uuid,
            timestamp: timestamp,
            ip: $rootScope.Person.properties.last_login_ip || 0,
            coordinates: $rootScope.Person.properties.last_login_coordinates || 0,
            tag: fulltag,
            rels: rels,
            track_id: trackId,
            from_path: $location.url(),
            to_path: toPath || $location.url()
          }

          if( nodeUuid ) {
            $http.post('/api/tracking/clicks', {
              params: params
            }).then(function( resp ) {
              // console.log( resp.data )
            })
            .catch(function( err ) {
              // console.error( err )
            })
          }
        }
      });
    }
  }
})
