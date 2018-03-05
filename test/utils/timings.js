const measure = async page => {
  const performanceTiming = JSON.parse(
    await page.evaluate(() => JSON.stringify(window.performance.timing))
  );

  return extractDataFromPerformanceTiming(
    performanceTiming,
    'responseEnd',
    'domInteractive',
    'domContentLoadedEventEnd',
    'loadEventEnd'
  );
};

const extractDataFromPerformanceTiming = (timing, ...dataNames) => {
  const navigationStart = timing.navigationStart;

  const extractedData = {};
  dataNames.forEach(name => {
    extractedData[name] = timing[name] - navigationStart;
  });

  return extractedData;
};

module.exports = { measure };