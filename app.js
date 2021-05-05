const chalk = require('chalk');
const axios = require('axios');
const yargs = require('yargs')
    .command('copy', 'Copy Labels From Github Repo to Another Github Repo', {
        src_user: {
            description: 'Src repository username',
            type: 'string',
            demandOption: true,
        },
        src_repo_name: {
            description: 'Src repository name',
            type: 'string',
            demandOption: true,
        },
        dist_user: {
            description: 'Dist repository username',
            type: 'string',
            demandOption: true,
        },
        dist_repo_name: {
            description: 'Dist repository name',
            type: 'string',
            demandOption: true,
        },
        ignore_default_labels: {
            description: 'Ignore default labels from copying',
            type: 'boolean',
            default: true,
        },
        gh_token: {
            description: 'Github Personal access token',
            type: 'string',
            demandOption: true,
        },
    })
    .demandCommand(1)
    .argv;

console.log(`\n=== ${chalk.cyanBright('Copying github labels tool is lunching')} ===\n`);


// Get Command
const command = yargs._[0];

// If Command is Copy
if (command === 'copy') {
    const srcUri = `https://api.github.com/repos/${yargs.src_user}/${yargs.src_repo_name}/labels?per_page=100`;
    const distUri = `https://api.github.com/repos/${yargs.dist_user}/${yargs.dist_repo_name}/labels?per_page=100`;
    const srcHeaders = {
        Authorization: `Bearer ${yargs.gh_token}`,
        Accept: 'application/vnd.github.symmetra-preview+json',
    };
    const distHeaders = {
        Authorization: `Bearer ${yargs.gh_token}`,
        Accept: 'application/vnd.github.v3+json',
    };

    (async () => {
    
        let src_labels = (await axios.get(srcUri, {headers: srcHeaders})).data;

        if (src_labels.length > 0) {
            src_labels = src_labels.map(label => {
                if (yargs.ignore_default_labels) {
                    if (label.default) {
                        return false;
                    }
                }

                return {
                    name: label.name,
                    color: label.color,
                    description: label.description,
                };
            });

            src_labels = src_labels.filter(label => label != false);
                        
            src_labels.map(label => {
                let data = {
                    // owner: yargs.dist_user,  
                    // repo: yargs.dist_repo_name,  
                    name: label.name,
                    color: label.color,
                    description: label.description,
                };
               
                
                axios.post(distUri, data, {headers: distHeaders})
                    .then(({data}) => {
                        if (data.id != undefined) {
                
                            console.log(`\n${chalk.bgHex(data.color)(`${data.name} added`)}\n`);
                        }
                    })
                    .catch(err => {
                        console.log(err.toJSON());

                        process.exit();
                    });

            });
        } else {
            console.log(`\n${chalk.bgRed('No labels found aborting...')}\n`);
            process.exit();
        }
    })()
}

