export const waitForLoad = async (element) => {
  if(browser.capabilities.browserName.localeCompare('internet explorer')){
    await new Promise(r => setTimeout(r, 5000));
    browser.isElementDisplayed(element);
  } else {
    await browser.waitUntil(async () => element.then(el => el.isDisplayed()), 5000, 'wait for element to load');
  }
};
