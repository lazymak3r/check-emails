const fs = require('fs');
const axios = require('axios');

const apiKey = 'kXeRIoS7mA36dEyFWsuQMKgaUb0nP4Vf';

async function appReadFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, data, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

async function appWriteFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

async function appAppendFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.appendFile(file, data, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

async function getStartFrom() {
  return new Promise((resolve, reject) => {
    let data = '';
    fs.createReadStream(`result.csv`, {encoding: "utf-8"})
      .on("data", (chunk) => {
        data = chunk.toString();
      })
      .on("error", (error) => {
        if (error.code === 'ENOENT') {
          resolve(0)
        }
        reject(error)
      })
      .on("close", (error) => {
        const lastChunkArr = data.trim().split('\n');
        const index = lastChunkArr[lastChunkArr.length - 1][0]
        const start = +index + 1;
        resolve(isNaN(start) ? 0 : start);
      });
  })
}

async function runApp() {
  const buffer = await appReadFile('dataairdrop.csv')
  const records = buffer.toString().trim().split('\n');

  let startFrom = 0;
  console.log(`Getting end point for resume...`)
  startFrom = await getStartFrom();
  console.log(`Resume from point: ${startFrom}`)

  for (let index = startFrom; index < records.length; index++) {
    if (+index === 0) {
      await appWriteFile('result.csv', '')
      await appAppendFile(`result.csv`, `Index,First Name;Last Name;Email;Country;Status\n`)
      await appWriteFile('errors.csv', '')
      await appAppendFile(`errors.csv`, `First Name,Last Name,Email,Country,Reason\n`)
      continue;
    }

    const record = records[index]
    const [firstName, lastName, email, country] = record.split(';');

    try {
      let result = [index, firstName.trim(), lastName.trim(), email.trim(), country.trim()];
      // Use axios to make the API request
      const url = `https://bulk-api.bulkemailchecker.com/?key=${apiKey}&email=${encodeURIComponent(email)}`;
      const response = await axios.get(url);
      const json = response.data;
      result.push(json.status)

      console.log(`[${+index}/${records.length - 1}] [${result.join(', ')}]`);
      await appAppendFile(`result.csv`, `${result.join(',')}\n`)
    } catch (error) {
      let errorRow = [firstName.trim(), lastName.trim(), email.trim(), country.trim(), error.message];
      await appAppendFile(`errors.csv`, `${errorRow.join(',')}\n`)
      console.error(`Error while processing email: ${email}`, error.message);
    }
  }
}

runApp()
