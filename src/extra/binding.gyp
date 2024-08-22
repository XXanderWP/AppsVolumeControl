{
  "targets": [
    { 
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "include_dirs" : [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "target_name": "volume",
      "sources": [ "volume.cpp" ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    },
  ]
}