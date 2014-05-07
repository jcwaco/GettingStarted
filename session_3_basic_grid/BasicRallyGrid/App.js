//Custom Rally App that displays Stories in a grid.

//Note: various console debugging messages intentionally kept in the code for learning purposes
// This change fixes Defect 17
//
// Change of State enabled
//
Ext.define('CustomApp', {
	extend : 'Rally.app.App', // The parent class manages the app 'lifecycle' and calls launch() when ready
	componentCls : 'app', // CSS styles found in app.css

	// Entry Point to App
	launch : function() {

		console.log('our second app'); // see console api: https://developers.google.com/chrome-developer-tools/docs/console-api

		this.pulldownContainer = Ext.create('Ext.container.Container', {
			layout : {
				type : 'hbox',
				align : 'stretch'
			},

		});
		this.add(this.pulldownContainer);

		this._loadIterations();
	},

	// Get list of Iterations from Rally
	_loadIterations : function() {

		this.iterationComboBox = Ext.create(
				'Rally.ui.combobox.IterationComboBox', {
					fieldLabel : 'Iteration',
					labelAlign : 'right',
					width : 300,
					listeners : {
						ready : function(comboBox) {
							console.log('Ready!', comboBox);
							// var selectedIteration = comboBox.getRecord().get('_ref');
							// this._loadData();
							this._loadSeverities();

						},
						select : function(comboBox, records) {
							console.log('Ready!', comboBox);
							this._loadData();
						},
						scope : this
					}
				});
		this.pulldownContainer.add(this.iterationComboBox);
	},

	_loadSeverities : function() {
		this.severityComboBox = Ext.create(
				'Rally.ui.combobox.FieldValueComboBox', {
					model : 'Defect',
					field : 'Severity',
					fieldLabel : 'Defect Severity',
					labelAlign : 'right',
					listeners : {
						ready : function(fvComboBox) {
							this._loadData();
						},
						select : function(fvComboBox, records) {
							this._loadData();
						},
						scope : this
					}

				});
		this.pulldownContainer.add(this.severityComboBox);
	},

	// Get data from Rally
	_loadData : function() {
		var selectedIterationRef = this.iterationComboBox.getRecord().get(
				'_ref');
		var selectedSeverityValue = this.severityComboBox.getRecord().get(
				'value');
		console.log('Selected Iteration:', selectedIterationRef);
		console.log('Selected Severity:', selectedSeverityValue);

		var myFilters = [ {
			property : 'Iteration',
			// operation: '=',
			value : selectedIterationRef
		}, {
			property : 'Severity',
			// operation: '=',
			value : selectedSeverityValue
		} ];
		// If store exists just load new data
		//
		if (this.defectStore) {
			console.log('Store exists');
			this.defectStore.setFilter(myFilters);
			this.defectStore.load();
		} else {
			console.log('Store Does not exist!');
			this.defectStore = Ext.create('Rally.data.wsapi.Store', {
				model : 'Defect',
				autoLoad : true, // <----- Don't forget to set this to true! heh
				filters : myFilters,
				listeners : {
					load : function(myStore, myData, success) {
						console.log('got data!', myStore, myData);
						if (!this.myGrid) {
							this._createGrid(myStore); // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
						}
					},
					scope : this
				// This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
				},
				fetch : [ 'FormattedID', 'Name', 'Severity', 'Iteration' ]
			// Look in the WSAPI docs online to see all fields available!
			});

		}
	},

	// Create and Show a Grid of given stories
	_createGrid : function(myDefectStore) {

		console.log('Creating Grid!!!');
		this.myGrid = Ext.create('Rally.ui.grid.Grid', {
			store : myDefectStore,
			columnCfgs : ['FormattedID', 'Name', 'Severity', 'Iteration']
		// Columns to display; must be the same names specified in the fetch: above in the wsapi data store
		});

		this.add(this.myGrid); // add the grid Component to the app-level Container (by doing this.add, it uses the app container)

		console.log('what is this?', this);

	}

});
