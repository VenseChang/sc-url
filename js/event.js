REGEX = /q\=\%40(?<key>[a-zA-Z0-9]+)(\+(?<val>[a-zA-Z0-9]*(\+[a-zA-Z0-9]*)*))?\&/i
REPLACE_VALUE_REGEX = /(?!\s)(\$\d+)*/g

urls = {
    "github": "https://github.com/VenseChang",
    "music": "http://music.youtube.com/"
}

document.addEventListener('DOMContentLoaded', function(){
    const url = window.location.href

    if (!REGEX.test(url)) return
    let { groups: { key, val } } = REGEX.exec(url)
    key = key.toLowerCase()

    const keys = Object.keys(urls).map(k => k.toLowerCase())
    let vals    = (val === undefined) ? undefined : val.split('+')
    let matches = urls[key].match(REPLACE_VALUE_REGEX).filter(v => v)

    if (matches.length === 0) {
        window.location.href = urls[key]
        return
    }

    if (vals.length !== matches.length) {
        console.error('Count of provide values are not match url setting.')
        return
    }

    if (keys.includes(key)) {
        let target_url = urls[key]
        matches.forEach((item, index) => {
            target_url = target_url.replace(item, vals[index])
        })
        window.location.href = target_url
    }
})
