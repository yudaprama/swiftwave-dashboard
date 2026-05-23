.PHONY: push-origin push-kawai push-all

push-origin:
	git push origin develop

push-kawai:
	git push kawai-network develop

push-all: push-origin push-kawai
