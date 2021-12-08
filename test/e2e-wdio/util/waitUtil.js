export const waitForLoad = async (element) => {
    const currentBrowser = browser.capabilities.browserName;
    if(currentBrowser.localeCompare('Internet Explorer 11') ||
      currentBrowser.localeCompare('iexplore') ||
      currentBrowser.localeCompare('internet explorer')){
    await new Promise(r => setTimeout(r, 5000));
    browser.isElementDisplayed(element);
  } else {
    await browser.waitUntil(async () => element.then(el => el.isDisplayed()), 5000, 'wait for element to load');
  }
};
