define([], function() {
    'use strict';
    return {
        webgenerateAnsible: function(webModel) {
            console.log("Generate Web Ansible Scripts..");
            console.log(webModel);
            // webModel.
            var readJSON = JSON.parse(webModel);
            var AppType = readJSON['WebApplicationModel']['AppType'];
            var name = readJSON['WebApplicationModel']['AppName'];
            var hostip = readJSON['WebApplicationModel']['host_ip'];
            var srcPath = readJSON['WebApplicationModel']['srcPath'];
            var language = readJSON['WebApplicationModel']['language'];
            var webEngine = readJSON['WebApplicationModel']['WebEngine'];
            var ostype = readJSON['WebApplicationModel']['OS']['name'];
            var osversion = readJSON['WebApplicationModel']['OS']['version'];

            console.log(AppType);
            console.log(name);
            console.log(srcPath);
            console.log(language);
            console.log(webEngine);

            console.log(hostip);
            console.log(ostype);
            console.log(osversion);

            // Create ansible file for WebServer
            var fs = require('fs');
            var fs = require('fs-extra')
            var path = require("path");
            var scriptdir = path.resolve(".");
            var mkdirp = require('mkdirp')
            scriptdir += "/examples/ansibleScript/";
            scriptdir += "LAMPApplication";
            scriptdir += Math.floor(Date.now());
            console.log(scriptdir);
            // if (fs.existsSync(scriptdir)) {
            //     console.log("Deleting: ", scriptdir);
            //     deleteDirectory(scriptdir);
            //     console.log("Deleted: ", scriptdir);
            // }
            fs.ensureDirSync(scriptdir, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Directory ' + directory + ' created.');
                }
            });

            //if (fs.existsSync(scriptdir))
            var hostfile = scriptdir + '/' + 'hosts';
            console.log(hostfile);

            var hostContent = "[webserver]\n";
            hostContent += hostip;
            hostContent += " ansible_connection=ssh ansible_user=ubuntu ansible_python_interpreter=/usr/bin/python3\n";
            //console.log (hostContent);
            if (fs.exists(hostfile)) {
                console.log("The host file is appending..!");
                fs.appendFile(hostfile, hostContent, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The host file was appended!");
                });
            }
            else {
                fs.writeFileSync(hostfile, hostContent, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The host file was saved!");
                });
            }


            //Genarating to the main playbook

            var deploydir = path.resolve(".");
            var deployFile = scriptdir + '/' + 'site.yml';
            console.log(deployFile);
            if (fs.exists(deployFile)) {
                //console.log('deploydir: ' + deploydir);
                var siteTempfile = deploydir + "/templates/siteTemp";
                console.log(siteTempfile);
                //Read the header file
                var siteTemp = fs.readFileSync(siteTempfile, 'utf8');

                fs.writeFileSync(deployFile, siteTemp);
            }

            var invars = "\n\n- include: webapp.yml";

            fs.appendFileSync(deployFile, invars);

            var webdeployFile = scriptdir + '/' + 'webapp.yml';
            var LAMPwebsiteTempfile = deploydir + "/templates/LAMPwebsiteTemp";
            var LAMPwebsiteTemp = fs.readFileSync(LAMPwebsiteTempfile, 'utf8');

            fs.writeFileSync(webdeployFile, LAMPwebsiteTemp);
            var vars = "\n\n  vars:\n";
            vars += "    - path: " + srcPath;
            console.log(vars);
            fs.appendFileSync(webdeployFile, vars);

            // Creating roles directory
            var roleDir = scriptdir + "/roles";

            fs.ensureDirSync(roleDir, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Role Directory ' + directory + ' created.');
                }
            });

            //  Creating Application directory in roles directory
            var roleAppDir = roleDir + "/" + name;
            fs.ensureDirSync(roleAppDir, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Role Directory ' + directory + ' created.');
                }
            });

            // Creating Tasks directory in Application directory
            var roleAppDir = roleDir + "/" + name;
            fs.ensureDirSync(roleAppDir, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Role Directory ' + directory + ' created.');
                }
            });
            // Creating Main Task file
            var roleTaskDir = roleAppDir + "/" + "tasks";
            fs.ensureDirSync(roleTaskDir, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Role Directory ' + directory + ' created.');
                }
            });
            // Creating Main Task file
            var mainTaskFile = roleTaskDir + "/" + "main.yml";
            //language
            fs.writeFileSync(mainTaskFile, "---\n");

            // MySQL driver
            var mysql = require('mysql');
            var replace = require("replace");
            var conn = mysql.createConnection({
                // host: "127.0.0.1",
                user: "root",
                password: "isislab"
            });

            // Connect to Database
            conn.connect(function (err) {
                if (err) throw err;
                console.log("Connected!");
            });


            if (language.toLowerCase() == "php") {
                var sql = "SELECT b.pkg_name FROM softwaredependency.packages b ,softwaredependency.swdependency a where b.app_id=a.id and a.AppType='" + language.toLowerCase() + "'";
                sql += "and b.sw_id in (select app_sw_id FROM softwaredependency.os_dependency where os_id in (SELECT id FROM softwaredependency.os_pkg_mgr ";
                sql += "where concat(OS_type,OS_version) = '" + ostype + osversion + "'))";
                console.log(sql);
                var install_language = "- include: install_" + language.toLowerCase() + ".yml\n";

                fs.appendFileSync(mainTaskFile, install_language);
                console.log(install_language);

                var ubuntu_pkg_vars = "\n\n      ubuntu_" + language.toLowerCase() + "_pkgs:\n";
                ubuntu_pkg_vars += "        <<packages>>"
                fs.appendFileSync(webdeployFile, ubuntu_pkg_vars);
                console.log(webdeployFile);
                var pkg_result = "";
                var replace = require("replace");

                // Query the DataBase
                conn.query(sql, function (err, rows) {
                    if (err) throw err;
                    for (var row in rows) {
                        var rowResult = "         - " + rows[row].pkg_name;
                        console.log(rowResult);
                        pkg_result += rowResult + "\n";
                    }

                    replace({
                        regex: "        <<packages>>",
                        replacement: pkg_result,
                        paths: [webdeployFile],
                        recursive: true,
                        silent: false,
                    });

                });

                // End Database Connection
                // conn.end(function (err) {
                //     if (err) {
                //         throw err;
                //         console.log(err);
                //     }
                //     else
                //         console.log("Disconnected!");
                // });
                console.log(ostype + osversion);
                var mysqlTempFile;
                if ((ostype + osversion).toLowerCase() === "ubuntu16.04")
                    mysqlTempFile = deploydir + "/templates/PHP16Temp";
                else if ((ostype + osversion).toLowerCase() === "ubuntu14.04")
                    mysqlTempFile = deploydir + "/templates/PHP14Temp";
                console.log(mysqlTempFile);
                //Read the header file
                var phpTemp = fs.readFileSync(mysqlTempFile, 'utf8');

                // Creating Task file
                var phpTaskFile = roleTaskDir + "/" + "install_" + language.toLowerCase() + ".yml";
                console.log(phpTaskFile);
                fs.writeFile(phpTaskFile, phpTemp, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The node file was generated!");
                });

                var copyCode = "- include: copy_code.yml\n";
                fs.appendFileSync(mainTaskFile, copyCode);
                //Read the header file
                var copyTempfile = deploydir + "/templates/copy_code_LAMP";
                var copyTemp = fs.readFileSync(copyTempfile, 'utf8');
                // Creating Copy-code file
                var copyTaskFile = roleTaskDir + "/" + "copy_code.yml";
                console.log(copyTaskFile);
                fs.writeFile(copyTaskFile, copyTemp, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The copy file was generated!");
                });

                // Creating Template files
                var roleTempDir = roleAppDir + "/" + "templates";
                fs.ensureDirSync(roleTempDir, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Role Directory ' + directory + ' created.');
                    }
                });
                //Read the header file
                var phpiniTempfile = deploydir + "/templates/php.ini.j2Temp";
                var phpiniTemp = fs.readFileSync(phpiniTempfile, 'utf8');
                // Creating Copy-code file
                var phpiniTempFile = roleTempDir + "/" + "php.ini.j2";
                console.log(phpiniTempFile);
                fs.writeFile(phpiniTempFile, phpiniTemp, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The php.ini.j2 file was generated!");
                });


                //Read the header file
                var confTempfile = deploydir + "/templates/www.conf.j2Temp";
                var confTemp = fs.readFileSync(confTempfile, 'utf8');
                // Creating Copy-code file
                var confTempFile = roleTempDir + "/" + "www.conf.j2";
                console.log(confTempFile);
                fs.writeFile(confTempFile, confTemp, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The www.conf.j2 file was generated!");
                });


            }

            if (webEngine == "ApacheHTTPServer") {
                var webengine = "apache";
                var install_webengine = "- include: install_" + webengine + ".yml";
                fs.appendFileSync(mainTaskFile, install_webengine);

                var en_sql = "SELECT b.pkg_name FROM softwaredependency.packages b ,softwaredependency.swdependency a where b.app_id=a.id and a.AppType='" + webengine + "'";
                en_sql += "and b.sw_id in (select app_sw_id FROM softwaredependency.os_dependency where os_id in (SELECT id FROM softwaredependency.os_pkg_mgr ";
                en_sql += "where concat(OS_type,OS_version) = '" + ostype + osversion + "'))";
                console.log(en_sql);
                var install_webengine = "- include: install_" + webengine + ".yml";
                //Read the header file
                var apacheTempfile = deploydir + "/templates/apache2";
                var apacheTemp = fs.readFileSync(apacheTempfile, 'utf8');
                // Creating Copy-code file
                var apacheTaskFile = roleTaskDir + "/" + "install_" + webengine + ".yml";
                console.log(copyTaskFile);
                fs.writeFile(apacheTaskFile, apacheTemp, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The apache file was generated!");
                });
                var pkg_result = "";
                var replace = require("replace");

                var en_result = "";
                // Query the DataBase
                conn.query(en_sql, function (err, rows) {
                    if (err) throw err;
                    for (var row in rows) {
                        var rowResult = rows[row].pkg_name;
                        console.log(rowResult);
                        en_result += rowResult + "\n";
                    }

                    replace({
                        regex: "<<apache>>",
                        replacement: en_result,
                        paths: [apacheTaskFile],
                        recursive: true,
                        silent: true,
                    });

                });

                // Creating Handler files
                var roleHandlerDir = roleAppDir + "/" + "handlers";
                fs.ensureDirSync(roleHandlerDir, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Handler Directory ' + directory + ' created.');
                    }
                });

                //Read the header file
                var apacheHandlerfile = deploydir + "/templates/apacheHandler";
                var apacheHandler = fs.readFileSync(apacheHandlerfile, 'utf8');
                // Creating Copy-code file
                var apacheHandlerFile = roleHandlerDir + "/" + "main.yml";
                console.log(apacheHandlerFile);
                fs.writeFile(apacheHandlerFile, apacheHandler, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The apacheHandler file was generated!");
                });

                var hndlr_result = "";
                // Query the DataBase
                conn.query(en_sql, function (err, rows) {
                    if (err) throw err;
                    for (var row in rows) {
                        var rowResult = rows[row].pkg_name;
                        console.log(rowResult);
                        hndlr_result += rowResult + " ";
                    }

                    replace({
                        regex: "<<apache>>",
                        replacement: hndlr_result,
                        paths: [apacheHandlerFile],
                        recursive: true,
                        silent: true,
                    });

                });

            }
            var roles = "\n\n  roles:\n";
            roles += "    - " + name;
            fs.appendFileSync(webdeployFile, roles);

            // End Database Connection
            conn.end(function (err) {
                if (err) {
                    throw err;
                    console.log(err);
                }
                else {
                    console.log("Disconnected!");
                }
            });

            var cp = require('shelljs');
            var command = "ansible-playbook " + deployFile;
            console.log(command);
            var exec = cp.exec;


            var sleep = require('sleep');
            require('file-size-watcher').watch(hostfile).on('sizeChange',
                function callback(newSize, oldSize) {
                    console.log('The file size changed from ' + oldSize + ' to ' + newSize);
                    if (newSize > oldSize) {
                        //sleep.sleep(10);
                        var shell = require('shelljs');
                        shell.cd(scriptdir);
                        var command = "ansible-playbook " + deployFile;
                        var exec = shell.exec;
                        console.log(command);
                        exec(command);
                    }
                });
        }
    }
});
