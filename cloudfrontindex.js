// Cloudfront viewer request function to automatically append /index.html on requests. Allows clean urls when hosting on s3.

function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension.
    else if (!/\..{2,4}$/.test(uri)) {
        request.uri += '/index.html';
    }

    return request;
}