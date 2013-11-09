(function () {

  var convertRecords = function(records) {
    var ret = []
    for (var i = 0; i < records.length; i++) {
      ret[i] = recordForSerialization(records[i]);
    }
    return ret;
  };

  // So record can be cached in local storage
  var recordForSerialization = function(record) {
    return { 
      completed: record.get('completed'),
      created: record.get('created'),
      taskname: record.get('taskname'),
      id: record.getId()
    };
  };

  var cacheRecordsLocally = function (records) {
    window.records = records;
    records = convertRecords(records);
    localStorage.cached_list = JSON.stringify(records);
  };

  document.addEventListener('DOMContentLoaded', function () {

    var are_you_sure_dialog = $('<div></div>').
    html("<p>Are you sure you want to delete all completed tasks?</p>").
    dialog({autoOpen: false,
      dialogClass: "no-close",
      title: '',
      buttons : {
        "Yes" : function() { 
          var main = $('#main');
          $( this ).dialog( "close" );
          main.show();
          var completed = taskTable.query({completed: true});
          for (var i = 0; i < completed.length; i++) {
            completed[i].deleteRecord(); 
          }
        },
      "No" : function() {
        $( this ).dialog( "close" );
        var main = $('#main');

        main.show();
      }
      },
      modal: true
    });
	// Insert your Dropbox app key here:
	var DROPBOX_APP_KEY = 'mssnaktycwvrb8q';

	// Exposed for easy access in the browser console.
	//var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
	var client = new Dropbox.Client({token: "Jg4zLdCM10EAAAAAAAAAASUkMzSFub3uMAQpWo1LxEnVDqY4yr5isq-Sun55Wc2O"});
	var taskTable;


		// Insert a new task record into the table.
		function insertTask(text) {
			return taskTable.insert({
				taskname: text,
				created: new Date(),
				completed: false
			});
		}

		// updateList will be called every time the table changes.
		function updateList(records) {
			$('#tasks').empty();

			// Sort by creation time.
			records.sort(function (taskA, taskB) {
        if (taskA.completed && !taskB.completed) return 1;
        if (!taskA.completed && taskB.completed) return -1;
				if (taskA.created < taskB.created) return 1;
				if (taskA.created > taskB.created) return -1;
				return 0;
			});

			// Add an item to the list for each task.
			for (var i = 0; i < records.length; i++) {
				var record = records[i];
				$('#tasks').append(
					renderTask(record.id,
						record.completed,
						record.taskname));
			}

			addListeners();
			$('#newTask').focus();
		}

		if (client.isAuthenticated()) {
			// Client is authenticated. Display UI.
			$('#loginButton').hide();
			$('#main').show();

        var records = JSON.parse(localStorage.cached_list);
        if (records) {
          updateList(records);
        }
			client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
				if (error) {
					alert('Error opening default datastore: ' + error);
				}


				// Populate the initial task list.

        taskTable = datastore.getTable('tasks');
        records = taskTable.query();
        cacheRecordsLocally(records);
				updateList(convertRecords(records));

				// Cache the records but don't update the list (want completed
        // tasks to stay where they are)
				datastore.recordsChanged.addListener(function (e) {
			    var records = taskTable.query();
          cacheRecordsLocally(records);
        });
			});
		}

		// Set the completed status of a task with the given ID.
		function setCompleted(id, completed) {
      $('#'+id).addClass('completed');
			taskTable.get(id).set('completed', completed);
		}

		// Delete the record with a given ID.
		function deleteRecord(id) {
			taskTable.get(id).deleteRecord();
		}

		// Render the HTML for a single task.
		function renderTask(id, completed, text) {
			return $('<li>').attr('id', id).append(
						$('<button>').addClass('checkbox').html('&#x2713;')
					).append(
						$('<span>').addClass('text').text(text)
					)
				.addClass(completed ? 'completed' : '');
		}

		// Register event listeners to handle completing and deleting.
		function addListeners() {
			$('span').click(function (e) {
				e.preventDefault();
				var li = $(this).parents('li');
				var id = li.attr('id');
				setCompleted(id, !li.hasClass('completed'));
			});

      $("#cleanUp").click(function(e) {
          e.preventDefault();
          var main = $('#main').hide();

          are_you_sure_dialog.dialog("open");
      return false;
      });
		}

		// Hook form submit and add the new task.
		$('#addForm').submit(function (e) {
			e.preventDefault();
			if ($('#newTask').val().length > 0) {
				var new_task = insertTask($('#newTask').val());
				$('#newTask').val('');
				$('#tasks').prepend(
          renderTask(new_task.getId(), false, new_task.get('taskname'))
        );
        addListeners();
			}
			return false;
		});

		$('#newTask').focus();
});

})();

