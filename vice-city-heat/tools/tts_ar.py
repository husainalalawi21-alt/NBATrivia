"""Run the library's edge-tts voice tool with TLS verified against the environment's CA bundle
(edge-tts pins certifi's bundle, which doesn't include this sandbox's proxy CA). Usage: tts_ar.py lines.json out_dir"""
import os, ssl, sys, runpy
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
CA = os.environ.get('SSL_CERT_FILE', '/root/.ccr/ca-bundle.crt')
import edge_tts.communicate as C
if os.path.exists(CA): C._SSL_CTX = ssl.create_default_context(cafile=CA)
sys.argv = [os.path.join(LIB, 'core/tts/tts_zh.py')] + sys.argv[1:]
sys.path.insert(0, os.path.join(LIB, 'core/tts'))
runpy.run_path(sys.argv[0], run_name='__main__')
