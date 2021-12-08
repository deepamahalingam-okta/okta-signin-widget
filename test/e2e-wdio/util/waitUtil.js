export const waitForLoad = async (element) => {
    const currentBrowser = browser.capabilities.browserName;
    if( currentBrowser === 'Internet Explorer 11' ||
        currentBrowser ==='iexplore' ||
        currentBrowser ==='internet explorer'){
        browser.wait(protractor.ExpectedConditions.visibilityOf(element), 10_000);
            //browser.isElementDisplayed(element);
    } else {
        await browser.waitUntil(async () => element.then(el => el.isDisplayed()), 5000, 'wait for element to load');
    }
};
