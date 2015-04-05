// Custom Rally App that displays Defects in a grid and filter by Iteration and/or Severity.
//
// Note: various console debugging messages intentionally kept in the code for learning purposes
// THIS IS A TEST
//

Ext.define('CustomApp', {
    extend: 'Rally.app.App',      // The parent class manages the app 'lifecycle' and calls launch() when ready
    componentCls: 'app',          // CSS styles found in app.css

    items: [
     {  // this container lets us control the layout of the pulldowns
	 xtype: 'container',
     itemId: 'pulldown-container',
     layout: {
             type: 'hbox',           // 'horizontal' layout
             align: 'stretch'
         } 
     }
            
    ],
    defectStore: undefined,       // app level references to the store and grid for easy access in various methods
    defectGrid: undefined,

    // Entry Point to App
    launch: function() {

      console.log('our second app');     // see console api: https://developers.google.com/chrome-developer-tools/docs/console-api

      this._loadIterations();
    },

    // create defect severity pulldown then load data
    _loadSeverities: function() {
        var severityComboBox = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
          itemId: 'severity-combobox',
          model: 'Defect',
          field: 'Severity',
          fieldLabel: 'Severity',
          labelAlign: 'right',
          listeners: {
            ready: this._loadData,     // this is the last 'data' pulldown we're loading so both events go to just load the actual defect data
            select: this._loadData,
            scope: this                 // <--- don't for get to pass the 'app' level scope into the combo box so the async event functions can call app-level func's!
         }       
        });
        
        // this.pulldownContainer.add(this.severityComboBox);    // add the severity list to the pulldown container so it lays out horiz, not the app!
        this.down('#pulldown-container').add(severityComboBox);        
    },
    // create iteration pulldown and load iterations
    _loadIterations: function() {
    	var me = this;
    	console.log ('Got Me', me);
    	
        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox', {
          itemId: 'iteration-combobox',
          fieldLabel: 'Iteration',
          labelAlign: 'right',
          width: 300,
          listeners: {
        	  ready: me._loadSeverities, // on ready: during initialization of the app, once Iterations are loaded, lets go get Defect Severities
        	  select: me._loadData,   // on select: after the app has fully loaded, when the user 'select's an iteration, lets just relaod the data
              scope: me
         }
        });

        // this.pulldownContainer.add(this.iterComboBox);	// add the iteration list to the pulldown container so it lays out horiz, not the app!
        this.down('#pulldown-container').add(iterComboBox);
       
    },
   
     // Construct filters for defects with Iteration and Severity
    _getFilters: function(iterationValue, severityValue) {
        var iterationFilter = Ext.create('Rally.data.wsapi.Filter', {
      	     property: 'Iteration',
      	     operator: '=',
      	     value: iterationValue
      	});
        var severityFilter = Ext.create('Rally.data.wsapi.Filter', {
                property: 'Severity',
                operation: '=',
                value: severityValue
          });
     
        return iterationFilter.and(severityFilter);	
    },
     
    // Get data from Rally
    _loadData: function() {

     // var selectedIterRef = this.iterComboBox.getRecord().get('_ref');              // the _ref is unique, unlike the iteration name that can change; lets query on it instead!
     var selectedIterRef = this.down('#iteration-combobox').getRecord().get('_ref');              // the _ref is unique, unlike the iteration name that can change; lets query on it instead!
     // var selectedSeverityValue = this.severityComboBox.getRecord().get('value');   // remember to console log the record to see the raw data and relize what you can pluck out
     var selectedSeverityValue = this.down('#severity-combobox').getRecord().get('value');   // remember to console log the record to see the raw data and relize what you can pluck out

      var myFilters = this._getFilters(selectedIterRef,selectedSeverityValue);

      console.log ('myFilters', myFilters.toString());
      // console.log ('severity filter', severityFilter, severityFilter.toString());
      
      // if store exists, just load new data
      if (this.defectStore) {
        console.log('store exists');
        this.defectStore.setFilter(myFilters);
        this.defectStore.load();

      // create store
      } else {
        console.log('creating store');
        this.defectStore = Ext.create('Rally.data.wsapi.Store', {     // create defectStore on the App (via this) so the code above can test for it's existence!
          model: 'Defect',
          autoLoad: true,                         // <----- Don't forget to set this to true! heh
          filters: myFilters,
          listeners: {
              load: function(myStore, myData, success) {
                  console.log('got data!', myStore, myData);
                  if (!this.defectGrid) {           // only create a grid if it does NOT already exist
                    this._createGrid(myStore);      // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
                  }
              },
              scope: this                         // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
          },
          fetch: ['FormattedID', 'Name', 'Severity', 'Iteration']   // Look in the WSAPI docs online to see all fields available!
        });
      }
    },

    // Create and Show a Grid of given defect
    _createGrid: function(myDefectStore) {

      this.defectGrid = Ext.create('Rally.ui.grid.Grid', {
        store: myDefectStore,
        columnCfgs: [         // Columns to display; must be the same names specified in the fetch: above in the wsapi data store
          'FormattedID', 'Name', 'Severity', 'Iteration'
        ]
      });

      this.add(this.defectGrid);       // add the grid Component to the app-level Container (by doing this.add, it uses the app container)

    }

});