REGEX = /q\=\%40(?<key>[a-zA-Z0-9\-\_\.]+)(\+(?<val>[a-zA-Z0-9\-\_\.]*(\+[a-zA-Z0-9\-\_\.]*)*))?\&/i
REPLACE_VALUE_REGEX = /(?!\s)(\$\d+)*/g

let urls
chrome.storage.local.get("settings", res => {
    urls = res.settings || {}

    if (Object.entries(urls).length !== 0) return
    chrome.storage.sync.get("settings", res => { urls = res.settings || {} })
})

function matchUrl(url) {
    return url.match(REPLACE_VALUE_REGEX).filter(v => v)
}

function findUrl(urls, size) {
    let res = urls.find(url => matchUrl(url).length === size)
    if(res !== undefined) return res

    return urls.find(url => matchUrl(url).length === 0)
}

document.addEventListener('DOMContentLoaded', function(){
    const url = window.location.href

    if (!REGEX.test(url)) return
    let { groups: { key, val } } = REGEX.exec(url)
    key = key.toLowerCase()

    const keys = Object.keys(urls).map(k => k.toLowerCase())
    let vals    = (val === undefined) ? [] : val.split('+')

    if (keys.includes(key)) {
        let target_url = findUrl(urls[key], vals.length)
        if(target_url === undefined) { return }

        let matches = matchUrl(target_url)
        matches.forEach((item, index) => {
            target_url = target_url.replace(item, vals[index])
        })
        window.location.href = target_url
    }
})
