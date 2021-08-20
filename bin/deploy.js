#!/usr/bin/env node

const { exec } = require("child_process");

let version = "v1"
let bucket = "markzingler.com"
let cmd = `aws s3 sync public s3://${bucket}/${version}`

exec(cmd, (error,stdout,stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`)
})
