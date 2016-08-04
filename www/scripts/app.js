'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

var db = window.openDatabase("TodoDevDB", "1.0", "Todo Dev Database", 10000); //Dev to work in webview

angular.module('todoApp', ['ionic', 'config', 'ngCordova'])

.run(function($ionicPlatform, $cordovaSQLite) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }


        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS tasks(id integer primary key, name string, completed boolean, checkdate date)");
        console.log('creating DB');


    });
})
    .factory('dateHelper', function($log){
            var monthNames = [
                "January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"
                ];
            var d = new Date();
            return {
                day : function(){
                    return d.getDate();
                },
                monthAsNumber : function(){
                    return d.getMonth() + 1;
                },
                monthAsString : function(){
                    return monthNames[d.getMonth()];
                },
                monthAsStringShort : function(){
                    return monthNames[d.getMonth()].slice(0,3);
                },
                year : function(){
                    return d.getYear();
                },
                full : function(){
                    return d.getMonth() + 1 + "-" + d.getDate() + "-" + d.getFullYear();
                }
            }

    })

    .factory('Tasks', function($log, $q, $cordovaSQLite, dateHelper) {
        return {
            all: function() {
                var query = "SELECT id, name, completed, checkdate FROM tasks";

                $log.debug(dateHelper.day());

                var deferred = $q.defer();
                $log.debug('query db');
                $cordovaSQLite.execute(db, query).then(function(result) {
                    deferred.resolve({
                        rows: result.rows
                    });
                }, function(error) {
                    deferred.resolve({
                        rows: []
                    });
                    $log.warn("Error: ", error);
                }, function(updates) {
                    deferred.update(updates);
                });

                return deferred.promise;
            },
            add : function(task){
                var query = "INSERT INTO tasks(name, completed, checkdate) VALUES(?,?,?)";

                 var deferred = $q.defer();

                $cordovaSQLite.execute(db, query, [task.name, 0, dateHelper.full]).then(function(result) {
                    $log.debug('sql success')
                    deferred.resolve({
                        rows: 1
                    });
                }, function(error) {
                    console.log("Error: ", error);
                }, function(updates) {
                    deferred.update(updates);
                });

                return deferred.promise;
            },
            delete : function(task){
                console.log('To Delte a task');
                var query = "DELETE FROM tasks where id = ?";

                var deferred = $q.defer();

                $cordovaSQLite.execute(db, query, [task.id]).then(function(result) {
                    $log.debug('sql success')
                    deferred.resolve({
                        rows: 1
                    });
                }, function(error) {
                    console.log("Error: ", error);
                }, function(updates) {
                    deferred.update(updates);
                });

                return deferred.promise;
            }

        }
    })
    .controller('ToDoCtrl', function($log, $scope, $timeout, $ionicModal,  Tasks, $ionicSideMenuDelegate, $cordovaSQLite, dateHelper) {
        $scope.loadView = false;

        $scope.currentMonth = dateHelper.monthAsStringShort();

        $scope.tasks = [];

        $scope.showRemove = false;


        var loadTasks = function() {
            console.log("Update Tasks");
            Tasks.all().then(function(data) {
                var b = [];
                for (var i = 0; i < data.rows.length; i++) {
                    b.push(data.rows.item(i));
                }
                $scope.tasks = b;
                $scope.loadView = true;
            });

        }

        loadTasks();


        $scope.editToggle = function(){
            $scope.showRemove = !$scope.showRemove;
        }

        $scope.removeTask = function(task){

            Tasks.delete(task);
            loadTasks();
        }

        $scope.updateTask = function(task) {
            console.log(task);


            //Move To Factory
            var query = "UPDATE tasks SET completed = ? WHERE id = ?";

            var reversePayed = (task.completed) ? 0 : 1;
            console.log(reversePayed);
            $cordovaSQLite.execute(db, query, [reversePayed, task.id]).then(function(res) {
                loadTasks();
            }, function(err) {
                console.error(err);
            });

            loadTasks(); //refresh the scope
        }



        // Create our modal
        $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
            $scope.taskModal = modal;
        }, {
            scope: $scope
        });


        $scope.createTask = function(task) {
            if (!task) { //If input is empty
                $log.warn('empty task in create task');
                return;
            }
            $log.debug('Creating new task...', task);

            Tasks.add(task).then(function(){$log.debug("Success .. Added New Task")});

            loadTasks();

            $scope.taskModal.hide();

            task.name = "";
        };

        $scope.newTask = function() {
            $log.debug('Clicked New Task');
            $scope.taskModal.show();
        };



        $scope.closeNewTask = function() {
            $scope.taskModal.hide();
        }


        // Try to create the first project, make sure to defer
        // this by using $timeout so everything is initialized
        // properly

        // $timeout(function() {
        //     if ($scope.projects.length == 0) {
        //         while (true) {
        //             var projectTitle = prompt('Your first project title:');
        //             if (projectTitle) {
        //                 createProject(projectTitle);
        //                 break;
        //             }
        //         }
        //     }
        // });

    });
