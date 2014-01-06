.PHONY: clean convert

CHROME_RUNTIME=`ls /usr/bin | grep 'chrom' | head -1`
GM_CONVERTER=$(realpath gm2chrome/converter.py)
PYTHON_RUNTIME=`which python3`

EXT_NAME=github-stars

EXT_SRC=$(realpath ./src)
EXT_SOURCE=${EXT_SRC}/${EXT_NAME}.js

EXT_TMP=`realpath ./tmp`

EXT_CRX_BUILD=$(realpath .)
EXT_CRX_BUILD_PEM=${EXT_CRX_BUILD}/${EXT_NAME}.pem
EXT_CRX_BUILD_CRX=${EXT_CRX_BUILD}/${EXT_NAME}.crx

EXT_GM_BUILD=$(realpath .)
EXT_GM_BUILD_SOURCE=${EXT_GM_BUILD}/${EXT_NAME}.js


all: build_crx build_gm clean_tmp


build_crx: convert_crx pack_crx

convert_crx:
	${PYTHON_RUNTIME} ${GM_CONVERTER} ${EXT_SOURCE} ${EXT_TMP}

pack_crx:
	if [ -a ${EXT_CRX_BUILD_PEM} ]; \
	then \
		${CHROME_RUNTIME} \
			--pack-extension=${EXT_TMP} \
			--pack-extension-key=${EXT_CRX_BUILD_PEM}; \
	else \
		${CHROME_RUNTIME} --pack-extension=${EXT_TMP}; \
		mv -f ${EXT_TMP}.pem ${EXT_CRX_BUILD_PEM}; \
	fi;
	mv -f ${EXT_TMP}.crx ${EXT_CRX_BUILD_CRX}


build_gm:
	cp ${EXT_SOURCE} ${EXT_GM_BUILD_SOURCE}


clean_tmp:
	rm -rf ${EXT_TMP}

clean: clean_tmp
