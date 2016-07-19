module.exports = {
    middlewares: [
        {
            name: 'HtmlMiddleware',
            options: {
                head: '<script> alert(1); </script>',
                body: '<script> alert(2); </script>'
            }
        },
        {
            name: 'FilterMiddleware',
            oprions: {
                ssl: true
            }
        }
    ]
}
