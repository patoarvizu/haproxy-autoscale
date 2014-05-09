var AWS = require('aws-sdk');
var fs = require('fs');
var swig = require('swig');

var updateConfiguration = module.exports = function(system, environment, isPrivate) {
  var ec2 = new AWS.EC2();
  var ec2Parameters = {
      Filters: [{
        Name: 'instance-state-name',
        Values: [ 'running' ]
      }, {
        Name: 'tag:System',
        Values: [system]
      }, {
        Name: 'tag:Environment',
        Values: [environment]
      }]
  };
  ec2.describeInstances(ec2Parameters, function(err, data) {
    if(err)
      console.log(err, err.stack);
    var ips = [];
    for(var i = 0; i < data.Reservations.length; i++)
      for(var j = 0; j < data.Reservations[i].Instances.length; j++)
      {
        if(isPrivate)
          ips.push(data.Reservations[i].Instances[j].PrivateIpAddress);
        else
          ips.push(data.Reservations[i].Instances[j].PublicIpAddress);
      }
    swig.setDefaults({ loader: swig.loaders.fs(__dirname + '/../'), cache: false });
    var template = swig.compileFile('haproxy_autoscale.yaml.template');
    var output = template({ips: ips, system: system});
    console.log(output);
    fs.writeFile("./haproxy_autoscale.yaml", output, function(err) { if (err) throw err; process.exit(); });
  });
};