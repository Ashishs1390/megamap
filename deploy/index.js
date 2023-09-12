const prompt  = require('prompt');
const command = require('child_process');


if( process.argv[2] === 'zensartest' ) {
  // deploy to zensartest

  command.execSync("npm run -s ruptive-build", {stdio:[0,1,2]});
  command.execSync("gulp build", {stdio:[0,1,2]});

  // deploy to elastic beanstalk
  command.execSync(`eb deploy zensar-testing --region ap-south-1 --profile ruptive`, {stdio:[0,1,2]});
}
else {
  prompt.start();

  // choose deploy environment
  console.log('Which Platform do you want to deploy to?')
  console.log('[aws, azure]')
  prompt.get(['platform'], function (err, result1) {

    if(result1.platform === 'aws') {
      // choose deploy environment
      console.log('Which Ruptive environment do you want to deploy to?')
      prompt.get(['environment'], function (err, result2) {

        console.log('What Region? (defaults to us-west-1)')
        console.log('[us-east-1, us-west-1, us-west-2]')
        prompt.get(['region'], function (err, result3) {
          // build app
          command.execSync("npm run -s ruptive-build", {stdio:[0,1,2]});
          command.execSync("gulp build", {stdio:[0,1,2]});

          // deploy to elastic beanstalk
          command.execSync(`eb deploy --profile ruptive ${result2.environment} --region=${result3.region}`, {stdio:[0,1,2]});
        });
      });
    } else if(result1.platform === 'azure') {
      prompt.get(['branch'], function(err, result2) {

        let tag = `deploy-${Date.now()}`
        const commands = [
          'git push origin master',
          'git stash',
          `git checkout --orphan ${tag}`,
          'npm run -s ruptive-build',
          'gulp build',
          'git add dist public/build -f',
          'git add .',
          `git commit -am "commit for ${tag}"`,
          `git push origin ${tag}:${result2.branch} -f`,
          'git checkout master',
          'git checkout master .',
          `git branch -D ${tag}`,
        ]
        commands.forEach(c => {
          command.execSync(c, {stdio:[0,1,2]});
        })
      })
    } else if(result1.platform === 'gcp') {
      const commands = [
        'npm run -s ruptive-build',
        'gulp build',
        'gcloud app deploy'
      ]
      commands.forEach(c => {
        command.execSync(c, {stdio:[0,1,2]});
      })

    } else {
      console.log('unsupported platform, try again')
    }
  });
}
