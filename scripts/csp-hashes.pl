#!/usr/bin/env perl
# index.html に直接書いた <script> / <style> の中身の SHA-256 ハッシュを、CSP に書ける形で出力する。
#   使い方: perl scripts/csp-hashes.pl index.html script   → 'sha256-xxxx=' 'sha256-yyyy='
# scripts/build.sh が dist/.htaccess の CSP に埋め込む。中身が1文字でも変わるとハッシュも変わるので、
# 手で書かず、必ずビルドのたびに計算し直す。
use strict;
use warnings;
use Digest::SHA qw(sha256_base64);

my ($file, $tag) = @ARGV;
die "使い方: perl scripts/csp-hashes.pl <html> script|style\n" unless $file && $tag && $tag =~ /\A(?:script|style)\z/;

open my $fh, '<:raw', $file or die "$file を開けません: $!\n";
my $html = do { local $/; <$fh> };

my @hashes;
while ($html =~ /<$tag(?:\s[^>]*)?>(.*?)<\/$tag>/sg) {
  my $b64 = sha256_base64($1);
  $b64 .= '=' while length($b64) % 4;   # Digest::SHA は末尾の = を付けないので補う
  push @hashes, "'sha256-$b64'";
}
die "$file に <$tag> が見つかりません\n" unless @hashes;
print join(' ', @hashes);
