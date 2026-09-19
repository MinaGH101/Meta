FROM postgres:16-alpine

COPY run-backup.sh /usr/local/bin/run-backup
RUN chmod +x /usr/local/bin/run-backup && sh -n /usr/local/bin/run-backup

ENTRYPOINT ["/usr/local/bin/run-backup"]
CMD ["daemon"]
