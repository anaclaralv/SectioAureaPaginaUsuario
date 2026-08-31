<?php
class Duvida {
    private $conn;
    private $table = "PI_Duvidas";

    public $id_duvida;
    public $nome;
    public $email;
    public $tipo;
    public $mensagem;
    public $status;
    public $resposta;
    public $data_envio;
    public $ativo;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " (nome, email, tipo, mensagem) VALUES (:nome, :email, :tipo, :mensagem)";
        $stmt = $this->conn->prepare($query);

        $this->nome = htmlspecialchars(strip_tags($this->nome));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->tipo = htmlspecialchars(strip_tags($this->tipo));
        $this->mensagem = htmlspecialchars(strip_tags($this->mensagem));

        $stmt->bindParam(":nome", $this->nome);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":tipo", $this->tipo);
        $stmt->bindParam(":mensagem", $this->mensagem);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
