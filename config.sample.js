module.exports = {
  filePath: 'd:\\request-tracer\\example\\',
  excludes: ['#', 'Site24x7', '/robots.txt', 'monitor.asp', 'Googlebot', 'wp-login.php'],
  includes: ['station'],
  minutes: 15,
  skeletonDays: 2,
  outputPath: 'd:\\request-tracer\\status.txt',
  db: {
    user: 'dbuser',
    pass: 'dbpass',
    host: 'localhost',
    port: 1433,
    database: 'dbname',
    table: 'tablename',
    dateField: 'createdAt',
    extraCondition: `operation = 'login'`
  }
}