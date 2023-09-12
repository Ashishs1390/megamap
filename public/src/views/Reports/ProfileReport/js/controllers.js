
function profileReportCtrl($scope, $uibModal, notify, sweetAlert, ProfileReportAPI, GraphJS, $stateParams, $rootScope, $state) {
    $scope.Getting = true;
    $scope.EditMode = false;
    $scope.editActive = false;
    // A fix for report profile where height can't be 100%

    $scope.ToggleDesignMode = function (bool){
      document.designMode= (bool) ?  "on":"off";
      $scope.editActive = !$scope.editActive;
    }
    $scope.PrintPersonaReport = function (){
        window.print();
    }

    $scope.subgraph = {};
    $scope.sorted_types = [{
        "label": "Attribute",
        "type": "profile_attributes"
    }, {
        "label": "Interaction",
        "type": "profile_interactions"
    }]


    ProfileReportAPI.SyncProfileReport($stateParams.uuid).then((response) => {
        $scope.Getting = false;
        $scope.subgraph = response;
        //Sort incoming attributes and interactions by Order props
        $scope.sorted_types.forEach((it) => {
            if ($scope.subgraph.node_label_index[it.label]) {
                $scope.subgraph.node_label_index[it.label].sort((a, b) => {
                    if (!$scope.subgraph.outgoing[it.type][a] || !$scope.subgraph.outgoing[it.type][b]) return;
                    let rel_id_a = $scope.subgraph.outgoing[it.type][a][0];
                    let rel_id_b = $scope.subgraph.outgoing[it.type][b][0];

                    let rel_a = $scope.subgraph.rels[rel_id_a];
                    let rel_b = $scope.subgraph.rels[rel_id_b];
                    return rel_a.properties.order - rel_b.properties.order;
                })
            }
        })

        $scope.SelectedPersona = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Persona[0]];
        $scope.SelectedProfile = $scope.subgraph.nodes[$scope.subgraph.node_label_index.Profile[0]];


        //Score each Note by importance and pain
        $scope.subgraph.node_label_index.Note.forEach(function (node_uuid) {
            let note_a = $scope.subgraph.nodes[node_uuid];
            let count_a = 0;
            let pain_a = 0;
            if ($scope.subgraph.incoming["pain"]) {
                if ($scope.subgraph.incoming['pain'][note_a.properties.uuid]) pain_a += $scope.subgraph.incoming['pain'][note_a.properties.uuid].length;
            }
            if ($scope.subgraph.incoming["vote"]) {
                if ($scope.subgraph.incoming['vote'][note_a.properties.uuid]) count_a += $scope.subgraph.incoming['vote'][note_a.properties.uuid].length;
            }

            note_a.properties.Importance = count_a;
            note_a.properties.Pain = pain_a;
        })


        //Isolate Attributes
        // Return's attribute and interaction nodes
        $scope.ProfileAttributes = $scope.subgraph.node_label_index.Attribute.map((item) => {
            let attribute = $scope.subgraph.nodes[item];
            return attribute;
        });


        //Compute Notes of each attribute
        $scope.ProfileAttributes.forEach((attribute) => {
            attribute.notes = [];
            if ($scope.subgraph.incoming.note_attribute[attribute.properties.uuid]) {
                attribute.notes = $scope.subgraph.incoming.note_attribute[attribute.properties.uuid].map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }
        })

        //Isolate Interactions
        $scope.ProfileInteractions = $scope.subgraph.node_label_index.Interaction.map((item) => {
            let interaction = $scope.subgraph.nodes[item];
            return interaction;
        });




        // Hard coded icons for now
        $scope.InteractionIcons = [
            "/build/images/icon--wants-and-needs.svg",
            "/build/images/icon--wants-and-needs.svg",
            "/build/images/icon--ideas.svg",
            "/build/images/icon--touchpoints.svg",
            "/build/images/icon--key-message.svg",
            "/build/images/icon--pain-points.svg"
        ];

        $scope.NotesOfEachInteraction = [];
        //Compute Notes of each interaction
        $scope.ProfileInteractions.forEach((interaction) => {
            let notes = {};
            if ($scope.subgraph.incoming.note_interaction[interaction.properties.uuid]) {
                notes = $scope.subgraph.incoming.note_interaction[interaction.properties.uuid];
                interaction.notes = notes.map((rel_uuid) => {
                    return $scope.subgraph.rels[rel_uuid].from_id;
                });
            }

            $scope.NotesOfEachInteraction.push(notes)
        })

        console.log($scope.ProfileInteractions)

        //Add a Ref-Safe clone of each interaction into each attribute.
        $scope.ProfileAttributes.forEach((attribute) => {
            attribute.Interactions = [];
            $scope.ProfileInteractions.forEach((interaction) => {
                //Copy Interaction and make copies of its Note array to be sorted independantly
                let interaction_clone = JSON.parse(JSON.stringify(interaction));
                interaction_clone.ImportantNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));
                interaction_clone.PainfulNotes = JSON.parse(JSON.stringify(interaction_clone.notes || []));

                interaction_clone.ImportantNotes = interaction_clone.ImportantNotes.filter(n => ~attribute.notes.indexOf(n));
                interaction_clone.PainfulNotes = interaction_clone.PainfulNotes.filter(n => ~attribute.notes.indexOf(n));

                interaction_clone.ImportantNotes.sort((a, b) => {
                    let note_a = $scope.subgraph.nodes[a];
                    let note_b = $scope.subgraph.nodes[b];

                    let val_a = note_a.properties.Importance || 0;
                    let val_b = note_b.properties.Importance || 0;

                    return val_b - val_a;
                })

                interaction_clone.PainfulNotes.sort((a, b) => {
                    let note_a = $scope.subgraph.nodes[a];
                    let note_b = $scope.subgraph.nodes[b];

                    let val_a = note_a.properties.Pain || 0;
                    let val_b = note_b.properties.Pain || 0;

                    return val_b - val_a;
                })
                attribute.Interactions.push(interaction_clone);
            })
        })


        // Add report cards based on number of attributes(up to 6 total)
        $scope.reportGrids = [];
        $scope.ProfileAttributes.forEach((attribute, index) => {
            $scope.reportGrids.push({attribute});
            if (index >= 6) return;
        });
    })

    $scope.gotoPrevState = function() {
        if ( !$rootScope.previousState.length ) {
            $rootScope.previousState = 'dashboard.profile'
            $state.go($rootScope.previousState)

        } else {
            $state.go($rootScope.previousState, $rootScope.previousParams)
        }
    }

}




function profileReportCardCtrl($scope) {
    $scope.image_url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjOqKI0kZG7nIV2w7AFRWfPUGiqeM0J26TbCp8irR1jZiNG556";
    $scope.SetSelectedInteraction = function (interaction) {
        $scope.SelectedInteraction = interaction;
    }
    $scope.SetSelectedAttribute = function (attribute) {
        $scope.SelectedAttribute = attribute;
        $scope.SetSelectedInteraction($scope.SelectedAttribute.Interactions[0]);
        SetAttributeDependentChartData();
    }

    $scope.hideNotes = function(val){
        let arr = $scope.$parent.$parent.$parent.$parent.UnSelectedInteractions;
        let bool = arr.indexOf(val);
        return ((bool > -1) ? false: true);
    }


    function SetAttributeDependentChartData() {
        $scope.labels = $scope.SelectedAttribute.Interactions.map(item => item.properties.title);
        // $scope.series =["Notes by Interaction"];
        $scope.data = $scope.SelectedAttribute.Interactions.map(item => item.ImportantNotes.length);
        //$scope.colors = $scope.SelectedAttribute.Interactions.map(item => item.properties.color);
    }

    $scope.SetViewMode = function (viewMode) {
        $scope.ViewMode = viewMode;
    }
    $scope.ViewMode = "table";
    //Trevors
    // $scope.SetSelectedAttribute($scope.i.attribute);
    // $scope.SetSelectedInteraction($scope.interactions.Interactions[0]);
    // $scope.SetSelectedAttribute($scope.index);


    //Need a MAP of color names to color codes if this is going to be automated
    $scope.options = {
        pieceLabel: {
            // render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
            render: 'label',

            // precision for percentage, default is 0
            precision: 0,

            // identifies whether or not labels of value 0 are displayed, default is false
            showZero: true,

            // font size, default is defaultFontSize
            fontSize: 10,

            // font color, can be color array for each data or function for dynamic color, default is defaultFontColor
            fontColor: '#000',

            // font style, default is defaultFontStyle
            fontStyle: 'normal',

            // font family, default is defaultFontFamily
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

            // draw label in arc, default is false
            arc: false,

            // position to draw label, available value is 'default', 'border' and 'outside'
            // default is 'default'
            position: 'outside',

            // draw label even it's overlap, default is false
            overlap: true,

            // set images when `render` is 'image'
            images: [
                {
                    src: 'image.png',
                    width: 16,
                    height: 16
                }
            ]
        }
    }

    $scope.summernote_options = {
        height: 300,
        focus: true,
        airMode: true,

      };
   




$scope.CustomField = '<p><br></p><table class="table table-bordered"><tbody><tr><td><p style="font-size: 13px;"><u><span style="font-weight: 700;">Custom Data Area</span></u></p><p style="font-size: 13px;"><br></p></td><td><p style="font-size: 13px;"><b>Lists</b>:</p><ul style="font-size: 13px;"><li>First Item</li><li>Second Item</li><li>3rd Item</li></ul></td></tr><tr><td><p style="font-size: 13px;"><b>Pics</b>:</p><p style="font-size: 13px;">&nbsp;<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAIcAbQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAAAQQFBgcCA//EADUQAAEEAQMCBQIDBgcAAAAAAAEAAgMEEQUSITFBBhNRYXEiMhQjkRVCUoHB8QckNENyobH/xAAZAQEBAAMBAAAAAAAAAAAAAAAABAECAwX/xAAfEQACAgIDAQEBAAAAAAAAAAAAAQIRAxIEITEiQRP/2gAMAwEAAhEDEQA/AO4oQhACEIQAhCEAIQhACEIQAhCEAJFNIoBoQhACEIQAvEsjYo3Pkdta0ZJPZe1nvGFryacUWSGyv+r4C0yT0i5G+OG8lEuaduG5EJa797M4/mpCw3h3Vo62oNic7bFP9PJ4B7FbgFa4sv8ASNmcuP8AnKhoSTXU5ghJNACRTSKAaEIQAhInAyeiji9WIJEzTg4PKw5JemUm/CQsH/idPJHWjMDN74ueOxP9FuYpWSs3scCFkPEeoRx2SAwyyOOGsaOSp+TNLGd+Mn/SzMOEDq8Usr3mVzQ7aP3fZWEHibUIrMUbZt4cMHf0bjooupapV0+sJr9Jw3jIBe1vU46+uUPNe5pLrtWAsdOcDf1aWnBH6rz0siW66Rc5Y29X2abTvF25gdcjG1zsBze6tbfiOlA0Bri+QjIaFz9mlzllcscHlgJfnOBjpj/tfeM7y8yRu86NuQ3oXey7R5GVfLOUsGOTtGnr6tbt34QH4a54GxvTC1QWQ8F1XzyOvTMDWjiMZzytfhWcfbW5EmfVSqI0imkV3OI0IQgKbW7zoCYcYaW5z3WP/aVh7pHxxCN2cYWx1qjPbBEbQ5uPXkLE27MtCb8I+rLuJw15xhx9AvOz3t9eHo8bXWl6ajRdRb+GmYXZPLs/ACxF3UXC7va180xJYf3Q0exWhobIqViVzdr5Who5zhZbV6E7T5tOX8xpBDHM5d64IPK4zblFJm8ElJstKlJ1+Ei7HE6KP6mMf2P9FClsuos/DMGyAfXG2Jm4ZJ5GOucnOflfbQdYjttEJd5czeHNc3Gf1VmdNe+QPLg7n0xgey2ULVWNkpW0ZfUKuq37kNyvYZGA4NEfmbTGAOgyQOvJPv7K+wLcxq2nNdKWY8yM5bIOhU3U60H4EMBDXMOWk9cqJ4fa+9qdYNGQzO4d29OfhJbNqJiNJOSN/o1OOjp8METQAG54GFOSaMABNepFUqPNbt2CRTSKyYGhCEAisVrLK89p7Jw3c2Q7Q4f+LalYzxH50FuU163nPOSxwH2lTclfJRx39Fdqj42ww0xKWyyHg/HqqC4/dWmMbSJIwWmMuyD7tPUZUxul2oi/UNTnG9oJDR24UenEJ/Omni2+ZjH8u68+T7PQVJelLYglDoL8YeSAGyEE8H+P391POuzsY3EkpGPvj+oH3VvDB5MbQ/7ANufT3UCfSNOeSHB0H1cujcW8razW1+nzr3G3DmWzKWHHDuQV0bwppcVWv54H5kg6n0XPotFsQ22OFnzazTkZ6/BXVtK/0EPGPpCo40fptk/Jl89ExCEK8hBIppFANCEIBFZe478VJK0SGM7yAc9VpLEgihe8kfSO651b1Ut1HaAcOcenb3UvJlVIp48W7Z61OlYtNMZy2Fhy1ufu+Uq9NzIi9/Lz6q4gmjla0nn1Xm0A3O3GFJoUbvwr9oa0tOOnYKpD4TfjDi18czMO5/RWEj973NIOB6d1Ratp0ceLUU5yHgAZ469PlaO/w6Qr9L2CIVSXbi7d6nOQt9pZzRi/4rnsYLT5bjljBlrlvdDe5+nQud6cKvi+k3J8LBCEK0jBIppFANCF85pGxROe84DQsN0Ck8W3xWomJuXSPGS0dcd1zO1fgmkaxoO932nuR6H3Wj8YzXLrXS1XMa+Plrc8qn8G+G5Nctuu3AY4YZMO55ee4x2XnTbyz6PRxpY8dstdJneA3npgYB4Cs5JGytdtP1Hn5V/PotEwmJkbWDsW8LNajplqlK58GZojwAOSF0eJxRyWRSZlPEF+eIilWafPnHLgeGN7knsven6E0Q8XZHjAw0u4yvN3S7OsukG/8PXhO3lpzKV9KOnmlY2Szu8sNzk5GAOeqlfpYuo+ljK/ynNhyC8DnB6BdD0IFumwA9dq5INUgm1VzHb3EEZcBxj5XXtImhnoROgdubtwq+MqkyPkP5RNQhCtIwSKaRQDVfq8E09YCAZIdkt/iCsELEo7KjKdOzm9mlrNh8Y/ZNpgMuZRlvIB9c/C0WjaXcp1XBzvLdI8vLMdMrSkLwWrlDBGDtHWWaUlRSSx22/7mVEkksN4fx7rRPiyOizviF2xojbJsOMnHdYyvWNjH9Oilvz7rLYYXAOHO09x6hR7emXb+mTRMLWSSfaew/uivp7WWWuMri4ZeNxzg98enC11GJsteN0eC3HZR4I7y7Kss9FSOaVvDGsU7LXCk+RrWEExvad/tjPC3/g6C/Az/NV312YILHkEnnjp7K7jgI7KSxmFZHCoysmnmclTPshIJrucASKaRQDQhCAEIQgEqzVdHj1EscZXxPb0LcYPyEIWHFSVMypOPaK1vhiUTRvF77XOJ/K+7PryrvTqMdGuIWEuAOclJC0jihHtI2lklLpsl4CaELoaAhCEAJIQgP/Z" style="width: 109px;"></p></td><td><p>Links:</p><p><a href="https://www.google.com/search?q=cat+image&amp;oq=cat+image&amp;aqs=chrome.0.69i59j69i60l2j69i65l2j69i60.1089j0j7&amp;sourceid=chrome&amp;ie=UTF-8" target="_blank"><u style=""><font color="#0000ff" style="">Link to Google</font></u></a></p><p><br></p></td></tr></tbody></table>'
}
