app.service('BlockersManagementAPI', function($http, $rootScope, GraphAPI) {
    const API_URL = GraphAPI.API_URL + "blockers/";

    /**
     * optional_entity_key: must have node entity label like 'from.' or 'to.'
     * return_entity: 'from', 'to' or 'from,rel,to'.
     */
    return {
        GetRelationsOfTypeWithLabelWhere: function(
            from_label,
            rel_label,
            optional_to_label,
            optional_entity_key, 
            optional_entity_val,
            return_entity
        ) {
            return $http.get(API_URL + 'notes/'+from_label+'/'+rel_label+'/'+optional_to_label+'/'+optional_entity_key+'/'+optional_entity_val+'/'+return_entity)
                .then(function(resp) {
                    if (resp.status == 200) return resp.data;
                    return;
                }).catch(function(err) {
                    throw err.data
                });
        }
    }
});