const fs = require('fs')
const sql = require('mssql')
const config = require('./config')
const path = config.filePath
const MS_PER_MINUTE = 60000
const MIN_PER_HOUR = 60
const HOUR_PER_DAY = 24
const now = new Date()
const fileName = getFileName()

fs.readFile(path + fileName, {encoding: 'utf-8'}, async (err, data) => {
  try {
    let isFree
    if (err) {
      if (err.code === 'ENOENT') {  // no log file for today
        isFree = true;
      } else {
        throw err;
      }
    } else {
      const excludes = config.excludes;
      const includes = config.includes;
      let lines = data.split('\r\n').filter(line => {
        let includeIt = true
        excludes.forEach(exclude => includeIt = includeIt && !line.includes(exclude))
        if (includeIt) {
          includeIt = false
          includes.forEach(include => includeIt = includeIt || line.includes(include))
        }
        return includeIt
      });
      if (lines.length === 0) {
        isFree = true
      } else {
        lines = await excludeSkeletonKeys(lines);
        const lastLine = lines.pop();
        if (lastLine === undefined) {
          isFree = true
        } else {
          lastLineArray = lastLine.split(' ');
          const lastDate = new Date(`${lastLineArray[0]}T${lastLineArray[1]}+0000`);
          const thresholdDate = new Date(now.getTime() - (MS_PER_MINUTE * config.minutes));
          isFree = lastDate < thresholdDate;
        }
      }
    }
    const msg = isFree ? 'No' : 'There was';
    console.log(`${msg} activity in the last ${config.minutes} minutes`);
    fs.writeFile(config.outputPath, isFree ? 'free' : 'busy', 'utf8', () => {})
  } catch(err) {
    console.error(err)
  } finally {
    sql.close()
  }
});

function getFileName () {
  const month = now.getMonth() + 1
  const monthStr = month >= 10 ? month : '0' + month
  const day = now.getDate()
  const dayStr = day >= 10 ? day : '0' + day
  return `u_ex${now.getFullYear() - 2000}${monthStr + dayStr}.log`;
}

async function excludeSkeletonKeys (lines) {
  try {
    thresholdDate = new Date(now.getTime() - (MS_PER_MINUTE * MIN_PER_HOUR * HOUR_PER_DAY * config.skeletonDays))
    await sql.connect(`mssql://${config.db.user}:${config.db.pass}@${config.db.host}:${config.db.port}/${config.db.database}`)
    let query = `select * from ${config.db.table} where ${config.db.dateField} > '${thresholdDate.toISOString()}'`
    if (config.db.extraCondition) {
      query += ` and ${config.db.extraCondition}`
    }
    const result = await sql.query(query)
    if (result.recordset.length === 0) {
      return lines
    } else {
      const skeletonIps = result.recordset.map(user => user.IPAddress)
      return lines.filter(line => !skeletonIps.some(ip => line.includes(ip)) )
    }
  } catch (err) {
    console.error(err)
  }
}
